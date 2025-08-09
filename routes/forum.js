// routes/forum.js
const express = require('express');
const router = express.Router();
const Forum = require('../models/forum');
const auth = require('../middleware/auth');
// Remove the User import since you're using discriminators

// Get all posts (public - no auth needed)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/forum - Fetching posts...');
    
    const posts = await Forum.find()
      .populate('author', 'firstName lastName email role') // This will work with discriminators
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
      createdAt: post.createdAt,
      comments: []
    }));

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

// Create new post (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /api/forum - Creating new post...');
    console.log('Request body:', req.body);
    console.log('User from auth:', req.user);
    
    const { title, body, image } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const newPost = new Forum({
      author: req.user.userId,
      title: title.trim(),
      body: body.trim(),
      image: image || ''
    });

    const savedPost = await newPost.save();
    console.log('Post saved with ID:', savedPost._id);
    
    // Populate author info
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

// Like/Unlike post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    console.log(`Attempting to like/unlike post: ${req.params.postId}`);
    console.log('User:', req.user);
    
    const post = await Forum.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
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

// Helper function
function getEmoji(role) {
  switch(role) {
    case 'Student': return '👩‍🎓';
    case 'Mentor': return '👨‍🏫';
    case 'Alumni': return '🎓';
    default: return '👤';
  }
}

module.exports = router;