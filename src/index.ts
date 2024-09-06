import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'
import { logger } from 'hono/logger'
import dbConnect from './db/connect'
import FavYoutubeVideosModel from './db/fav-youtube-model'
import { isValidObjectId } from 'mongoose'
import { stream, streamText, streamSSE } from 'hono/streaming'

const app = new Hono()

//middlewares
app.use(poweredBy())
app.use(logger())


dbConnect()
  .then(() => {
    //GET route
    app.get('/', async (c) => {
      const documents = await FavYoutubeVideosModel.find();
      console.log("Hello from / route")
      return c.json(
        documents.map((d) => d.toObject()), 200
      )
    })

    // create document, POST route
    app.post('/', async (c) => {
      const formData = await c.req.json();
      if(!formData.thumbnailUrl) delete formData.thumbnailUrl;

      try {
        const document = await FavYoutubeVideosModel.create(formData);
        return c.json(document.toObject(), 201);
      } 
      catch(error) {
        return c.json(
          (error as any)?.message || "Internal server error", 500
        )
      }
    })

    // view document by Id
    app.get('/:documentId', async (c) => {
      const id = c.req.param("documentId");
      if(!isValidObjectId(id)) return c.json("Invalid object id", 400);

      const document = await FavYoutubeVideosModel.findById(id);
      if(!document) return c.json("Invalid document id", 404);

      return c.json(document.toObject(), 200);
    })

    //stream document by id
    app.get('/d/:documentId', async (c) => {
      const id = c.req.param("documentId");
      if(!isValidObjectId(id)) return c.json("Invalid object id", 400);

      const document = await FavYoutubeVideosModel.findById(id);
      if(!document) return c.json("Invalid document id", 404);
      
      return streamText(c, async (stream) => {
        stream.onAbort(() => {
          console.log('Aborted!')
        })

        for(let i = 0; i < document.description.length; i ++) {
          await stream.write(document.description[i])
          // Wait 1/10 seconds.
          await stream.sleep(100)
        }
        
      })
    })

    // update document by id
    app.patch('/:documentId', async (c) => {
      const id = c.req.param("documentId");
      if(!isValidObjectId(id)) return c.json("Invalid object id", 400);

      const document = await FavYoutubeVideosModel.findById(id);
      if(!document) return c.json("Invalid document id", 404);

      const formData = await c.req.json();

      if(!formData.thumbnailUrl) delete formData.thumbnailUrl;

      try {
        const updatedDocument = FavYoutubeVideosModel.findByIdAndUpdate(id, formData, { new: true });
        return c.json(updatedDocument, 200);
      } 
      catch(e) {
        return c.json(
          (e as any)?.message || "Internal server error", 500
        )
      }
    })

    // delete document by id
    app.delete('/:documentId', async (c) => {
      const id = c.req.param("documentId");
      if(!isValidObjectId(id)) return c.json("Invalid object id", 400);

      try {
        const deletedDocument = await FavYoutubeVideosModel.findByIdAndDelete(id);
        return c.json(deletedDocument?.toObject(), 200)
      }
      catch(e) {
        return c.json(
          (e as any)?.message || "Internal server error", 500
        )
      }
    })



    
    
  })
  .catch((err) => {
    app.get('/*', (c) => {
      return c.text(`Failed to connect to mongodb: ${err.message}`)
    })
  })



const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

app.onError((err, c) => {
  return c.text(`App Error: ${err.message}`);
})

export default app;