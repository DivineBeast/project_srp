# AI-Powered Personalized Notes Generator

## Overview
The Personalized Notes Generator is an AI-powered application that transforms various input sources (text, images, and videos) into structured, easy-to-understand study notes. Built with Flask and leveraging Google's Gemini AI, this tool helps students, researchers, and lifelong learners efficiently process and condense information.

## Key Features

### Multi-Source Input Processing
- **Text Input**: Directly process typed or pasted text
- **Image Upload**: Extract text from images using OCR (Tesseract)
- **Video Processing**: Generate notes from YouTube videos using speech-to-text (Whisper)

### Intelligent Note Generation
- Three output styles: Concise, Detailed, and Visual
- Markdown formatting for better readability
- Key concept extraction and summarization

### User-Friendly Interface
- Modern, responsive design
- Dark/light theme toggle
- Interactive elements with visual feedback
- Drag & drop image upload with preview

## Installation Guide

### Prerequisites
- Python 3.8+
- Tesseract OCR
- FFmpeg
- Whisper CLI

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notes-generator.git
   cd notes-generator
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install external dependencies**
   - **Tesseract OCR**:
     - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
     - macOS: `brew install tesseract`
     - Windows: Download from [Tesseract GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
   
   - **FFmpeg**:
     - Ubuntu/Debian: `sudo apt-get install ffmpeg`
     - macOS: `brew install ffmpeg`
     - Windows: Download from [FFmpeg website](https://ffmpeg.org/)

4. **Set up environment variables**
   Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. **Install Whisper CLI**
   ```bash
   pip install -U openai-whisper
   ```

## How It Works

### Text Processing
1. User enters text directly
2. Text is sent to Gemini API
3. AI generates structured notes based on selected style

### Image Processing
1. User uploads an image containing text
2. Backend uses Tesseract OCR to extract text
3. Extracted text is processed by Gemini AI
4. Formatted notes are returned to user

### Video Processing
1. User provides YouTube video URL
2. System attempts multiple extraction methods:
   - First tries YouTube's auto-generated captions
   - Falls back to Whisper speech-to-text
   - Final fallback uses video metadata
3. Transcript is processed by Gemini AI
4. Structured notes are generated

## Running the Application

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Test each input type:
   - **Text**: Enter or paste content directly
   - **Image**: Drag & drop or click to upload
   - **Video**: Paste a YouTube URL

## Error Handling
The application provides clear error messages for:
- Invalid YouTube URLs
- Large file uploads (>5MB)
- Unsupported file formats
- API connection issues
- Content extraction failures

## Troubleshooting

### Common Issues
1. **Tesseract not found**:
   - Verify installation path is in system PATH
   - On Windows, may need to set `TESSDATA_PREFIX` environment variable

2. **Whisper model download failures**:
   ```bash
   whisper --model base
   ```
   (Let it download required models)

3. **FFmpeg not available**:
   - Verify installation
   - Check PATH environment variable

### Logs
Detailed logs are available in:
- `app.log` for backend operations
- Browser console for frontend issues

## Future Enhancements
- [ ] Support for PDF document uploads
- [ ] Multi-language support
- [ ] Note export options (PDF, Markdown)
- [ ] Collaborative note editing
- [ ] Mobile app version

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Google Gemini AI for the core note generation
- Tesseract OCR for image text extraction
- OpenAI Whisper for speech-to-text
- yt-dlp for YouTube content downloading

---

For support or feature requests, please open an issue on our [GitHub repository](https://github.com