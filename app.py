from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import os
from dotenv import load_dotenv
from PIL import Image
import pytesseract
import requests
import logging
import json
import re
import google.generativeai as genai
import yt_dlp
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "your-secret-key")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notes_generator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# API keys from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")

# Initialize the Gemini client
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def home():
    return render_template('index.html', current_user=current_user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation
        errors = []
        if not username:
            errors.append('Username is required')
        if not email:
            errors.append('Email is required')
        elif '@' not in email:
            errors.append('Invalid email format')
        if not password:
            errors.append('Password is required')
        elif len(password) < 8:
            errors.append('Password must be at least 8 characters')
        if password != confirm_password:
            errors.append('Passwords do not match')
        
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            if existing_user.username == username:
                errors.append('Username already exists')
            if existing_user.email == email:
                errors.append('Email already exists')
        
        if errors:
            for error in errors:
                flash(error, 'danger')
        else:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

@app.route('/generate-notes', methods=['POST'])
@login_required
def generate_notes():
    try:
        data = request.json
        source_text = data.get('text')
        if not source_text:
            return jsonify({"error": "No text provided"}), 400
        
        # Get preferred style if provided (default to 'concise')
        style = data.get('style', 'concise')
        
        # Generate notes based on the style
        notes = generate_notes_with_style(source_text, style)
        
        return jsonify({"notes": notes})
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}")
        return jsonify({"error": "Failed to generate notes. Please try again."}), 500

@app.route('/generate-notes-from-image', methods=['POST'])
@login_required
def generate_notes_from_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        image_file = request.files['image']
        style = request.form.get('style', 'concise')
        
        # Process the image to extract text
        image = Image.open(image_file)
        extracted_text = pytesseract.image_to_string(image)
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            return jsonify({"error": "Could not extract sufficient text from the image"}), 400
        
        # Generate notes from the extracted text
        notes = generate_notes_with_style(extracted_text, style)
        
        return jsonify({"notes": notes})
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

@app.route('/generate-notes-from-video', methods=['POST'])
@login_required
def generate_notes_from_video():
    try:
        data = request.json
        video_url = data.get('videoUrl')
        style = data.get('style', 'concise')
        
        if not video_url:
            return jsonify({"error": "No video URL provided"}), 400
        
        logger.info(f"Processing video URL: {video_url}")
        video_info = get_youtube_video_info(video_url)
        
        if not video_info:
            return jsonify({"error": "Could not extract information from the video"}), 400
        
        # Generate notes from the metadata
        notes = generate_notes_from_video_info(video_info, style)
        
        return jsonify({"notes": notes})
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": "Failed to process video. Please try again later."}), 500

def generate_notes_with_style(text, style):
    """Generate notes based on the specified style"""
    prompts = {
        'concise': f"Generate concise and well-structured learning notes for the following text. Use bullet points where appropriate and highlight key concepts: {text}",
        'detailed': f"Generate detailed learning notes with examples for the following text. Include explanations of key concepts: {text}",
        'visual': f"Generate learning notes for the following text with a focus on visual organization. Use bullet points, numbering, and clear section headings: {text}"
    }
    
    prompt = prompts.get(style, prompts['concise'])
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating notes with Gemini: {str(e)}")
        raise Exception(f"Failed to generate notes: {str(e)}")

def get_youtube_video_info(video_url):
    """Get basic information about a YouTube video using yt-dlp"""
    try:
        ydl_opts = {
            'skip_download': True,
            'no_warnings': True,
            'quiet': True,
            'format': 'best',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            return {
                'title': info.get('title', 'Unknown Title'),
                'description': info.get('description', ''),
                'duration': info.get('duration', 0),
                'channel': info.get('uploader', 'Unknown Channel'),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date', '')
            }
    except Exception as e:
        logger.error(f"Error extracting video info: {str(e)}")
        return None

def generate_notes_from_video_info(video_info, style):
    """Generate notes based on video metadata using Gemini"""
    video_metadata = f"""
    YouTube Video: {video_info['title']}
    Channel: {video_info['channel']}
    Description: {video_info['description']}
    Duration: {video_info['duration']} seconds
    """
    
    prompts = {
        'concise': f"Based on this YouTube video information, generate concise learning notes about what this video likely teaches. Use bullet points for key concepts:\n{video_metadata}",
        'detailed': f"Based on this YouTube video information, generate detailed learning notes about what this video covers. Include explanations of probable key concepts:\n{video_metadata}",
        'visual': f"Based on this YouTube video information, create structured learning notes with clear headings and organized points about what this video likely teaches:\n{video_metadata}"
    }
    
    prompt = prompts.get(style, prompts['concise'])
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating notes from video info: {str(e)}")
        raise Exception(f"Failed to generate notes from video: {str(e)}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)