
import api from '../api/client';

export const getPosts = async (params = {}) => {
  const response = await api.get('/posts', { params });
  return response.data.data;
};

export const getPost = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data.data;
};

export const createPost = async (postData) => {
  const response = await api.post('/posts', postData);
  return response.data.data;
};

export const updatePost = async (id, postData) => {
  const response = await api.patch(`/posts/${id}`, postData);
  return response.data.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};

export const getMyPosts = async (params = {}) => {
  const response = await api.get('/posts/my', { params });
  return response.data.data;
};

export const getTags = async () => {
  const response = await api.get('/tags');
  return response.data.data.tags;
};

export const getUserProfile = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch('/users/me', profileData);
  return response.data.data.user;
};
