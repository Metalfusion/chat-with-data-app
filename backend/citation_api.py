import os
import asyncio
from quart import jsonify, Blueprint
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

bp_citation = Blueprint("citation", __name__)

# Mongo vCore config from environment
MONGO_CONN_STR = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING")
MONGO_DB_NAME = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_DATABASE", "SpeechDB")
MONGO_CHUNKS = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_CONTAINER", "Chunks")
MONGO_PHRASES = "Phrases"
MONGO_FILES = "Files"

mongo_client = None
mongo_db = None

def get_mongo():
    global mongo_client, mongo_db
    if mongo_client is None:
        mongo_client = AsyncIOMotorClient(MONGO_CONN_STR)
        mongo_db = mongo_client[MONGO_DB_NAME]
    return mongo_db

# API to get extended citation info
@bp_citation.route("/citation/<chunk_id>", methods=["GET"])
async def get_extended_citation(chunk_id):
    db = get_mongo()
    from bson.errors import InvalidId
    try:
        # Try ObjectId, fallback to string id
        chunk = await db[MONGO_CHUNKS].find_one({"_id": chunk_id}, {
            "_id": 1,
            "ChunkIndex": 1,
            "StartPhraseIndex": 1,
            "EndPhraseIndex": 1,
            "SpeechFileId": 1,
            "Title": 1,
        })

        if not chunk:
            return jsonify({"error": "Chunk not found"}), 404

        # Fetch File and Phrase documents in parallel
        file_task = db[MONGO_FILES].find_one({"_id": chunk["SpeechFileId"]}, {
            "_id": 1,
            "BlobName": 1,
            "BlobUrl": 1,
            "CreatedAt": 1,
            "FileHash": 1,
            "OriginalFileName": 1,
            "SourceInfo": 1
        })
        phrases_cursor = db[MONGO_PHRASES].find({"SpeechFileId": chunk["SpeechFileId"]}, {
            "_id": 1,
            "DisplayText": 1,
            "Duration": 1,
            "RawRecognizedText": 1,
            "RecognitionConfidence": 1,
            "RecognitionSuccess": 1,
            "SpeechFileId": 1,
            "StartTime": 1
        })

        file_doc, phrases = await asyncio.gather(
            file_task,
            phrases_cursor.to_list(length=1000)
        )

        return jsonify({
            "chunk": chunk,
            "file": file_doc,
            "phrases": phrases
        })
    except Exception as e:
        import logging
        logging.exception("Error in /citation/<chunk_id>")
        return jsonify({"error": str(e)}), 500
