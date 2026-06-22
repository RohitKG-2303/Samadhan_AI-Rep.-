from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Import ML services
from services.embeddings import EmbeddingService
from services.document_processor import DocumentProcessor
from services.comparison import DocumentComparison
from services.signal_analyzer import SignalAnalyzer

# Initialize services
embedding_service = EmbeddingService()
doc_processor = DocumentProcessor()
comparison_service = DocumentComparison()
signal_analyzer = SignalAnalyzer()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/embeddings/create', methods=['POST'])
def create_embeddings():
    try:
        data = request.json
        text = data.get('text')
        embeddings = embedding_service.embed_text(text)
        return jsonify({'embeddings': embeddings}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/parse', methods=['POST'])
def parse_document():
    try:
        file = request.files['file']
        content = doc_processor.parse_file(file)
        return jsonify({'content': content}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/compare', methods=['POST'])
def compare_documents():
    try:
        data = request.json
        doc1 = data.get('doc1')
        doc2 = data.get('doc2')
        differences = comparison_service.compare(doc1, doc2)
        return jsonify({'differences': differences}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/signals/analyze', methods=['POST'])
def analyze_signals():
    try:
        data = request.json
        diagram = data.get('diagram')
        analysis = signal_analyzer.analyze(diagram)
        return jsonify({'analysis': analysis}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('NODE_ENV') == 'development')
