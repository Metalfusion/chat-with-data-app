import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey

# Data is split into two databases because the AI search requires vector search and 
# MongoDB Atlas is the cheapest option (free) for that, but with limited DB size.
# Rest of the data is stored in Cosmos DB NoSQL because it is easy and cheap to use, with low latency from Azure.

class SpeechDbService:
    def __init__(self):
        # MongoDB config
        self.mongo_conn_str = os.environ.get("SPEECH_MONGODB_CONNECTION_STRING")
        self.mongo_db_name = os.environ.get("SPEECH_MONGODB_DATABASE", "SpeechDB")
        self.mongo_chunks = os.environ.get("SPEECH_CHUNKS_CONTAINER", "Chunks")
        self.mongo_client = None
        self.mongo_db = None

        # Cosmos DB config
        self.cosmos_endpoint = os.environ.get("SPEECH_COSMOSDB_ENDPOINT")
        self.cosmos_key = os.environ.get("SPEECH_COSMOSDB_KEY")
        self.cosmos_db_name = os.environ.get("SPEECH_COSMOSDB_DATABASE", "SpeechDB")
        self.cosmos_files = os.environ.get("SPEECH_FILES_CONTAINER", "Files")
        self.cosmos_phrases = os.environ.get("SPEECH_PHRASES_CONTAINER", "Phrases")
        self.cosmos_client = None
        self.cosmos_db = None

    async def init_clients(self):
        
        # MongoDB client used for chunks.
        if self.mongo_client is None:
            self.mongo_client = AsyncIOMotorClient(self.mongo_conn_str)
            self.mongo_db = self.mongo_client[self.mongo_db_name]
        
        # Cosmos DB client used for rest of the data.
        if self.cosmos_client is None:
            self.cosmos_client = CosmosClient(self.cosmos_endpoint, credential=self.cosmos_key)
            self.cosmos_db = self.cosmos_client.get_database_client(self.cosmos_db_name)

    async def get_chunk(self, chunk_id):
        await self.init_clients()
        return await self.mongo_db[self.mongo_chunks].find_one({"_id": chunk_id}, {
            "_id": 1,
            "ChunkIndex": 1,
            "StartPhraseIndex": 1,
            "EndPhraseIndex": 1,
            "SpeechFileId": 1,
            "Title": 1,
        })

    async def get_file(self, speech_file_id):
        await self.init_clients()
        container = self.cosmos_db.get_container_client(self.cosmos_files)
        query = "SELECT * FROM c WHERE c.id=@id"
        params = [{"name": "@id", "value": speech_file_id}]
        items = [item async for item in container.query_items(query, parameters=params)]
        return items[0] if items else None

    async def get_phrases(self, speech_file_id):
        await self.init_clients()
        container = self.cosmos_db.get_container_client(self.cosmos_phrases)
        query = "SELECT * FROM c WHERE c.SpeechFileId=@sfid"
        params = [{"name": "@sfid", "value": speech_file_id}]
        items = [item async for item in container.query_items(query, parameters=params)]
        return items
