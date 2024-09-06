import mongoose, { Schema } from 'mongoose';

export interface IFavYoutubeSchema {
  title: string;
  description: string;
  thumbnailUrl?: string;
  watched: boolean;
  youtuberName: string;
}

const FavYoutubeVideoSchema = new Schema<IFavYoutubeSchema> ({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: false,
    default: ""
  },
  watched: {
    type: Boolean,
    required: true,
    default: false
  },
  youtuberName: {
    type: String,
    required: true
  },
  
})

const FavYoutubeVideosModel = mongoose.model<IFavYoutubeSchema>('fav-youtube-videos', FavYoutubeVideoSchema);

export default FavYoutubeVideosModel;