import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { poweredBy } from 'hono/powered-by';
import { logger } from 'hono/logger';
import dbConnect from './db/connect';
import FavYoutubeVideosModel from './db/fav-youtube-model';
import { isValidObjectId } from 'mongoose';
import { streamText } from 'hono/streaming';

const app = new Hono();

// Middleware
app.use(poweredBy());
app.use(logger());


// GET all documents
app.get('/', async (c) => {
  try {
    const documents = await FavYoutubeVideosModel.find();
    return c.json(documents.map((d) => d.toObject()), 200);
  } catch (error) {
    return c.json((error as any)?.message || "Internal server error", 500);
  }
});

// POST: Create a new document
app.post('/', async (c) => {
  try {
    const formData = await c.req.json();
    if (!formData.thumbnailUrl) delete formData.thumbnailUrl;
    const document = await FavYoutubeVideosModel.create(formData);
    return c.json(document.toObject(), 201);
  } catch (error) {
    return c.json({ error: "Failed to create document", message: (error as any).message }, 500);
  }
});

// GET document by ID
app.get('/:documentId', async (c) => {
  const id = c.req.param('documentId');
  if (!isValidObjectId(id)) return c.json('Invalid object id', 400);
  
  try {
    const document = await FavYoutubeVideosModel.findById(id);
    if (!document) return c.json('Document not found', 404);
    return c.json(document.toObject(), 200);
  } catch (error) {
    return c.json((error as any)?.message || "Internal server error", 500);
  }
});

// Stream document description by ID
app.get('/d/:documentId', async (c) => {
  const id = c.req.param('documentId');
  if (!isValidObjectId(id)) return c.json('Invalid object id', 400);
  
  try {
    const document = await FavYoutubeVideosModel.findById(id);
    if (!document) return c.json('Document not found', 404);

    return streamText(c, async (stream) => {
      stream.onAbort(() => {
        console.log('Stream aborted!');
      });

      for (let i = 0; i < document.description.length; i++) {
        await stream.write(document.description[i]);
        await stream.sleep(100); // Wait 1/10 seconds between each character
      }
    });
  } catch (error) {
    return c.json((error as any)?.message || "Internal server error", 500);
  }
});

// PATCH: Update document by ID
app.patch('/:documentId', async (c) => {
  const id = c.req.param('documentId');
  if (!isValidObjectId(id)) return c.json('Invalid object id', 400);

  try {
    const formData = await c.req.json();
    if (!formData.thumbnailUrl) delete formData.thumbnailUrl;

    const updatedDocument = await FavYoutubeVideosModel.findByIdAndUpdate(id, formData, { new: true });
    if (!updatedDocument) return c.json('Document not found', 404);

    return c.json(updatedDocument.toObject(), 200);
  } catch (error) {
    return c.json((error as any)?.message || "Internal server error", 500);
  }
});

// DELETE document by ID
app.delete('/:documentId', async (c) => {
  const id = c.req.param('documentId');
  if (!isValidObjectId(id)) return c.json('Invalid object id', 400);

  try {
    const deletedDocument = await FavYoutubeVideosModel.findByIdAndDelete(id);
    if (!deletedDocument) return c.json('Document not found', 404);

    return c.json(deletedDocument.toObject(), 200);
  } catch (error) {
    return c.json((error as any)?.message || "Internal server error", 500);
  }
});

// Handle errors globally
app.onError((err, c) => {
  return c.text(`App Error: ${err.message}`);
});

// Database connection
dbConnect()
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err.message);
  });

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
