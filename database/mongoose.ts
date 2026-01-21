import mongoose from "mongoose";

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached){
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    const mongoUri = process.env.MONGODB_URI?.trim();
    if(!mongoUri){
        throw new Error("MongoDB URI is missing (set MONGODB_URI in .env)");
    }

    if(cached.conn) return cached.conn;

    if(!cached.promise) {
        cached.promise = mongoose.connect(mongoUri, {
            bufferCommands: false,
            // Fail fast when MongoDB is down/misconfigured so UI doesn't "hang"
            serverSelectionTimeoutMS: 5_000,
            connectTimeoutMS: 5_000,
        });
    }

    try{
        cached.conn = await cached.promise;
    }
    catch(err){
        cached.promise = null;
        throw err;
    }

    console.log(`MongoDB Connected in ${process.env.NODE_ENV}`);
    return cached.conn;
}
