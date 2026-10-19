
import React, { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import api from './api/client';
import {
  getPosts,
  getPost,
  getMyPosts,
  getTags,
  createPost,
  updateProfile,
} from './services/blogService';

const containerStyle = {
  maxWidth: '1050px',
  margin: '0 auto',
  padding: '24px 16px',
};

const fieldStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '6px',
  marginBottom: '16px',
  border: '1px solid var(--border-color, #ddd)',
  borderRadius: '8px',
  font: 'inherit',
  boxSizing: 'border-box',
};

const passwordRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const passwordButtonStyle = {
  padding: '10px 12px',
  marginTop: '-10px',
  marginBottom: '16px',
  border: '1px solid var(--border-color, #ddd)',
  borderRadius: '8px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

function Button({ children, ...props }) {
  return (
    <button className="btn btn-primary" {...props}>
      {children}
    </button>
  );
}

// Gets the ID from the user object or, if necessary, the login token.
function getUserId(user) {
  if (user?._id) return String(user._id);
  if (user?.id) return String(user.id);

  try {
    const token = localStorage.getItem('devblog-token');
    if (!token) return '';

    const payloadPart = token.split('.')[1];
    if (!payloadPart) return '';

    const base64 = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    );

    const id =
      payload.userId ||
      payload.id ||
      payload._id ||
      payload.sub;

    return id ? String(id) : '';
  } catch {
    return '';
  }
}

function Navbar({ theme, onToggle }) {
  const { user, logout } = useAuth();
  const profileId = getUserId(user);

  return (
    <header style={{ borderBottom: '1px solid var(--border-color, #ddd)' }}>
      <nav
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/"
          style={{ fontSize: '1.5rem', fontWeight: 800, textDecoration: 'none' }}
        >
          DevBlog
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <NavLink to="/">Home</NavLink>

          {user ? (
            <>
              <NavLink to="/write">Write</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>

              {profileId ? (
                <NavLink to={`/profile/${encodeURIComponent(profileId)}`}>
                  Profile
                </NavLink>
              ) : (
                <span title="Your account ID is unavailable">Profile</span>
              )}

              <button
                className="btn btn-ghost"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Get started</NavLink>
            </>
          )}

          <ThemeToggle theme={theme} onToggle={onToggle} />
        </div>
      </nav>
    </header>
  );
}

function PostCard({ post }) {
  const authorId = post.author?._id || post.author?.id;

  return (
    <article className="card" style={{ marginBottom: '18px' }}>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt=""
          style={{
            width: '100%',
            maxHeight: '280px',
            objectFit: 'cover',
            borderRadius: '10px 10px 0 0',
          }}
        />
      )}

      <div className="card-body">
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          {(post.tags || []).map((tag) => (
            <span className="tag" key={tag._id || tag.slug || tag.name}>
              {tag.name}
            </span>
          ))}
        </div>

        <h2>
          <Link to={`/posts/${post._id}`} style={{ textDecoration: 'none' }}>
            {post.title}
          </Link>
        </h2>

        <p className="text-muted">
          By{' '}
          {authorId ? (
            <Link to={`/profile/${authorId}`}>
              {post.author.name}
            </Link>
          ) : (
            post.author?.name || 'Unknown author'
          )}
          {' · '}
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString()
            : ''}
        </p>

        <Link to={`/posts/${post._id}`}>Read article →</Link>
      </div>
    </article>
  );
}

function Home() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getPosts({
      search: search.trim() || undefined,
      tag: activeTag || undefined,
    })
      .then((data) => {
        if (!cancelled) setPosts(data.posts || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load posts.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, activeTag]);

  return (
    <main style={containerStyle}>
      <section style={{ padding: '32px 0' }}>
        <p className="text-muted">A home for developer stories</p>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '12px' }}>
          Share what you build.
          <br />
          Learn from others.
        </h1>

        <p className="text-muted">
          Discover tutorials, ideas and experiences from the developer community.
        </p>

        <Link className="btn btn-primary" to="/write">
          Write a post
        </Link>
      </section>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <input
          style={{ ...fieldStyle, flex: '1 1 240px', marginBottom: 0 }}
          placeholder="Search articles by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTag === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTag('')}
        >
          All topics
        </button>

        {tags.map((tag) => (
          <button
            type="button"
            className={`btn ${activeTag === tag.slug ? 'btn-primary' : 'btn-secondary'}`}
            key={tag._id || tag.slug}
            onClick={() => setActiveTag(tag.slug)}
          >
            {tag.name} ({tag.postCount})
          </button>
        ))}
      </div>

      <h2>Latest articles</h2>

      {loading && <p>Loading posts...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="card card-body">
          <h3>No posts found</h3>
          <p className="text-muted">
            Try another search or choose a different topic.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch('');
              setActiveTag('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </main>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Authentication failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ ...containerStyle, maxWidth: '480px' }}>
      <div className="card">
        <div className="card-body">
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>

          <p className="text-muted">
            {isRegister
              ? 'Join the DevBlog community.'
              : 'Log in to continue writing.'}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  style={fieldStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={50}
                  required
                />
              </>
            )}

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              style={fieldStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>

            <div style={passwordRowStyle}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                style={{ ...fieldStyle, flex: 1, minWidth: 0 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined}
                required
              />

              <button
                type="button"
                style={passwordButtonStyle}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy}>
              {busy
                ? 'Please wait...'
                : isRegister
                  ? 'Create account'
                  : 'Login'}
            </Button>
          </form>

          <p style={{ marginTop: '20px' }}>
            {isRegister ? 'Already have an account? ' : 'New to DevBlog? '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Login' : 'Register'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <main style={containerStyle}>Checking login...</main>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function WritePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const data = await createPost({
        title,
        content,
        coverImage,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        status,
      });

      const post = data.post || data;
      navigate(status === 'published' ? `/posts/${post._id}` : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your post.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ ...containerStyle, maxWidth: '800px' }}>
      <h1>Write an article</h1>
      <p className="text-muted">Your draft stays private until you publish it.</p>

      <form className="card card-body" onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          style={fieldStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={3}
          maxLength={160}
          required
        />

        <label htmlFor="cover">Cover image URL (optional)</label>
        <input
          id="cover"
          type="url"
          style={fieldStyle}
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />

        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          id="tags"
          style={fieldStyle}
          placeholder="javascript, react"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <label htmlFor="content">Article content (Markdown supported)</label>
        <textarea
          id="content"
          style={{ ...fieldStyle, minHeight: '280px', resize: 'vertical' }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <label htmlFor="status">Save as</label>
        <select
          id="status"
          style={fieldStyle}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        {error && <p role="alert" className="form-error">{error}</p>}

        <Button type="submit" disabled={busy}>
          {busy ? 'Saving...' : status === 'draft' ? 'Save draft' : 'Publish article'}
        </Button>
      </form>
    </main>
  );
}

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    setLoading(true);
    setError('');

    try {
      const data = await getMyPosts(status ? { status } : {});
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your posts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [status]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this post permanently?')) return;

    try {
      await api.delete(`/posts/${id}`);
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the post.');
    }
  }

  return (
    <main style={containerStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <h1>Your dashboard</h1>
        <Link className="btn btn-primary" to="/write">Write a post</Link>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '20px 0',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'All posts', value: '' },
          { label: 'Drafts', value: 'draft' },
          { label: 'Published', value: 'published' },
        ].map((item) => (
          <button
            type="button"
            key={item.value || 'all'}
            className={`btn ${status === item.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatus(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading your posts...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p>No posts in this section yet.</p>
      )}

      {posts.map((post) => (
        <article className="card card-body" key={post._id} style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3>{post.title}</h3>
              <span className={`badge ${post.status === 'draft' ? 'badge-draft' : 'badge-published'}`}>
                {post.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {post.status === 'published' && (
                <Link to={`/posts/${post._id}`}>View</Link>
              )}

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(post._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </main>
  );
}

function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getPost(id)
      .then((data) => {
        if (!cancelled) setPost(data.post || data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load this post.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <main style={containerStyle}>Loading article...</main>;
  if (error) return <main style={containerStyle}><p role="alert">{error}</p></main>;
  if (!post) return <main style={containerStyle}>Post not found.</main>;

  return (
    <main style={{ ...containerStyle, maxWidth: '800px' }}>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt=""
          style={{
            width: '100%',
            maxHeight: '380px',
            objectFit: 'cover',
            borderRadius: '12px',
          }}
        />
      )}

      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>{post.title}</h1>

      <p className="text-muted">
        By {post.author?.name || 'Unknown author'}
        {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString()}`}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        {(post.tags || []).map((tag) => (
          <span className="tag" key={tag._id || tag.slug || tag.name}>
            {tag.name}
          </span>
        ))}
      </div>

      <pre
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          font: 'inherit',
          lineHeight: 1.8,
        }}
      >
        {post.content}
      </pre>
    </main>
  );
}

function Profile() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const currentUserId = getUserId(user);
  const isOwnProfile = currentUserId && currentUserId === id;

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setProfile(null);
    setError('');

    api.get(`/users/${id}`)
      .then((response) => {
        if (cancelled) return;

        const data = response.data.data;
        setProfile(data.user);
        setName(data.user.name || '');
        setBio(data.user.bio || '');
        setAvatarUrl(data.user.avatarUrl || '');
        setPosts(data.posts || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load profile.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const updated = await updateProfile({ name, bio, avatarUrl });
      setProfile(updated);
      setUser(updated);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    }
  }

  if (error && !profile) {
    return <main style={containerStyle}><p role="alert">{error}</p></main>;
  }

  if (!profile) return <main style={containerStyle}>Loading profile...</main>;

  return (
    <main style={containerStyle}>
      <section className="card card-body" style={{ marginBottom: '24px' }}>
        {profile.avatarUrl && (
          <img
            src={profile.avatarUrl}
            alt=""
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        )}

        <h1>{profile.name}</h1>
        <p className="text-muted">{profile.bio || 'No bio yet.'}</p>

        {isOwnProfile && (
          <form onSubmit={handleSave}>
            <h2>Edit profile</h2>

            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              style={fieldStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
            />

            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              style={fieldStyle}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />

            <label htmlFor="avatar-url">Avatar URL</label>
            <input
              id="avatar-url"
              type="url"
              style={fieldStyle}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />

            {message && <p role="status">{message}</p>}
            {error && <p role="alert">{error}</p>}

            <Button type="submit">Save profile</Button>
          </form>
        )}
      </section>

      <h2>Published articles</h2>
      {posts.length === 0 && <p>No published articles yet.</p>}
      {posts.map((post) => <PostCard key={post._id} post={post} />)}
    </main>
  );
}

function NotFound() {
  return (
    <main style={containerStyle}>
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('devblog-theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devblog-theme', theme);
  }, [theme]);

  return (
    <>
      <Navbar
        theme={theme}
        onToggle={() =>
          setTheme((current) => current === 'light' ? 'dark' : 'light')
        }
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/posts/:id" element={<PostDetails />} />
        <Route path="/profile/:id" element={<Profile />} />

        <Route
          path="/write"
          element={
            <ProtectedRoute>
              <WritePost />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <footer style={{ ...containerStyle, textAlign: 'center' }}>
        <p className="text-muted">DevBlog · Built for developers</p>
      </footer>
    </>
  );
}
