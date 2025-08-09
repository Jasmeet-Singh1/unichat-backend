// routes/forum.js - Complete file with image upload, comments, and like status fix
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Forum = require('../models/forum');
const auth = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/forum-images/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'forum-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all posts (public but better with auth for like status)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/forum - Fetching posts...');
    
    // Get user ID from auth header if present (optional for public access)
    let currentUserId = null;
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
        console.log('User authenticated for like status:', currentUserId);
      } catch (err) {
        // Token invalid but still allow access for public viewing
        console.log('Invalid token, proceeding without user context');
      }
    }
    
    const posts = await Forum.find()
      .populate('author', 'firstName lastName email role')
      .populate('comments.author', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${posts.length} posts`);

    // Transform posts for frontend
    const transformedPosts = posts.map(post => ({
      id: post._id,
      author: post.author ? 
        `${getEmoji(post.author.role || 'Student')} ${post.author.firstName} ${post.author.lastName} (${post.author.role || 'Student'})` : 
        '👤 Unknown User',
      title: post.title || 'Untitled',
      message: post.body || '',
      image: post.image || '',
      likes: post.likes ? post.likes.length : 0,
      userLiked: currentUserId ? post.likes.includes(currentUserId) : false, // Check if current user liked this post
      createdAt: post.createdAt,
      comments: post.comments.map(comment => ({
        id: comment._id,
        author: comment.author ? 
          `${getEmoji(comment.author.role || 'Student')} ${comment.author.firstName} ${comment.author.lastName}` : 
          '👤 Unknown User',
        text: comment.text,
        createdAt: comment.createdAt
      }))
    }));

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

// Create new post with optional image upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('POST /api/forum - Creating new post...');
    const { title, body, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    // Use uploaded file or provided URL
    let finalImageUrl = '';
    if (req.file) {
      finalImageUrl = `/uploads/forum-images/${req.file.filename}`;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }

    const newPost = new Forum({
      author: req.user.userId,
      title: title.trim(),
      body: body.trim(),
      image: finalImageUrl
    });

    const savedPost = await newPost.save();
    console.log('Post saved with ID:', savedPost._id);
    
    await savedPost.populate('author', 'firstName lastName email role');

    const responsePost = {
      id: savedPost._id,
      author: savedPost.author ? 
        `${getEmoji(savedPost.author.role || 'Student')} ${savedPost.author.firstName} ${savedPost.author.lastName} (${savedPost.author.role || 'Student'})` : 
        '👤 Unknown User',
      title: savedPost.title,
      message: savedPost.body,
      image: savedPost.image || '',
      likes: 0,
      userLiked: false,
      createdAt: savedPost.createdAt,
      comments: []
    };

    res.status(201).json({
      message: 'Post created successfully',
      post: responsePost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

// Add comment to post
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Forum.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      author: req.user.userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    
    // Populate the new comment's author info
    await post.populate('comments.author', 'firstName lastName email role');
    
    const addedComment = post.comments[post.comments.length - 1];
    const responseComment = {
      id: addedComment._id,
      author: addedComment.author ? 
        `${getEmoji(addedComment.author.role || 'Student')} ${addedComment.author.firstName} ${addedComment.author.lastName}` : 
        '👤 Unknown User',
      text: addedComment.text,
      createdAt: addedComment.createdAt
    };

    res.status(201).json({
      message: 'Comment added successfully',
      comment: responseComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Like/Unlike post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    console.log(`Attempting to like/unlike post: ${req.params.postId}`);
    
    const post = await Forum.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // User already liked, so unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Add like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      userLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Failed to like post', error: error.message });
  }
});

// Delete a post (only by author or admin)
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Forum.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author (you might want to add admin check too)
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Forum.findByIdAndDelete(req.params.postId);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Helper function to get emoji based on role
function getEmoji(role) {
  switch(role) {
    case 'Student': return '👩‍🎓';
    case 'Mentor': return '👨‍🏫';
    case 'Alumni': return '🎓';
    default: return '👤';
  }
}

module.exports = router;