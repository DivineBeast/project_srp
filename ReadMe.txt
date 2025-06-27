# Notes Generator Project - Libraries Overview

## Core Libraries

- **Flask**: Web framework for creating the application interface and handling routes
- **Gemini API**: Powers the AI note generation for all input types
- **Python-dotenv**: Manages environment variables like API keys

## Text Processing

- **Basic Python text handling**: For processing direct text input

## Image Processing

- **Pytesseract**: OCR (Optical Character Recognition) library for extracting text from images
- **Pillow/PIL**: Python Imaging Library for handling image uploads and processing

## Video Processing

- **yt-dlp**: Downloads YouTube videos and extracts content (replaced pytube for better reliability)
- **FFmpeg**: Required for audio processing from videos
- **Whisper**: OpenAI's speech-to-text model for transcribing audio to text when needed

## Frontend

- **HTML/CSS/JavaScript**: For the tab-based interface and responsive design
- **Drag & drop functionality**: For easy image uploads

## Utility Libraries

- **Logging**: Python's built-in logging module for comprehensive debugging
- **Exception handling**: For graceful error management

## Installation Dependencies

- **Tesseract OCR**: External software required for image text extraction
- **FFmpeg**: External software needed for audio processing
	pip install -r requirements.txt
- **Environment setup**: .env file with Gemini API key

This project combines these technologies to create a versatile notes generator that can process text, images with text content, and YouTube videos, converting them all into well-structured notes using AI.