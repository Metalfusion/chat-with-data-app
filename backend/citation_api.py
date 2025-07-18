import asyncio
from quart import jsonify, Blueprint
from backend.speech_db_service import SpeechDbService

bp_citation = Blueprint("citation", __name__)

# API to get extended citation info
@bp_citation.route("/citation/<chunk_id>", methods=["GET"])
async def get_extended_citation(chunk_id):
    db_service = SpeechDbService()
    try:
        chunk = await db_service.get_chunk(chunk_id)
        if not chunk:
            return jsonify({"error": "Chunk not found"}), 404

        # Fetch File and Phrase documents in parallel (Cosmos DB)
        file_task = db_service.get_file(chunk["SpeechFileId"])
        phrases_task = db_service.get_phrases(chunk["SpeechFileId"])
        file_doc, phrases = await asyncio.gather(file_task, phrases_task)

        return jsonify({
            "chunk": chunk,
            "file": file_doc,
            "phrases": phrases
        })
    except Exception as e:
        import logging
        logging.exception("Error in /citation/<chunk_id>")
        return jsonify({"error": str(e)}), 500
