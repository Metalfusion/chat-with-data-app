import asyncio
from quart import jsonify, Blueprint
from backend.speech_db_service import get_speech_db_service

bp_transcript = Blueprint("transcript", __name__)

# API to get extended transcript info
@bp_transcript.route("/transcript/<speech_file_id>", methods=["GET"])
async def get_transcript(speech_file_id):
    db_service = get_speech_db_service()
    try:
        speech_file = await db_service.get_file(speech_file_id)
        if not speech_file:
            return jsonify({"error": "Speech file not found"}), 404

        phrases, summary = await asyncio.gather(
            db_service.get_phrases(speech_file_id),
            db_service.get_summary(speech_file_id)
        )

        return jsonify({
            "file": speech_file,
            "phrases": phrases,
            "summary": summary
        })
    
    except Exception as e:
        import logging
        logging.exception("Error in /transcript/<chunk_id>")
        return jsonify({"error": str(e)}), 500


@bp_transcript.route("/transcript/<speech_file_id>/summary", methods=["GET"])
async def get_transcript_summary(speech_file_id):
    
    db_service = get_speech_db_service()
    try:
        summary = await db_service.get_summary(speech_file_id)
    
        if summary is None:
            return jsonify({"error": "Summary not found"}), 404
        return jsonify(summary)
    
    except Exception as e:
        import logging
        logging.exception("Error in /transcript/<speech_file_id>/summary")
        return jsonify({"error": str(e)}), 500