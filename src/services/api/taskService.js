import tasksData from '../mockData/tasks.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class TaskService {
  constructor() {
    this.tasks = [...tasksData];
    this.cache = new Map();
  }

  _invalidateCache() {
    this.cache.clear();
  }

  _getCacheKey(method, ...args) {
    return `${method}:${JSON.stringify(args)}`;
  }

async getAll() {
    const cacheKey = this._getCacheKey('getAll');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    await delay(300);
    const result = [...this.tasks];
    this.cache.set(cacheKey, result);
    return result;
  }

  async getById(id) {
    await delay(200);
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }
    return { ...task };
  }

async create(taskData) {
    await delay(250);
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    this.tasks.push(newTask);
    this._invalidateCache();
    return { ...newTask };
  }

async update(id, updates) {
    await delay(200);
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    this.tasks[index] = {
      ...this.tasks[index],
      ...updates
    };
    
    this._invalidateCache();
    return { ...this.tasks[index] };
  }

async delete(id) {
    await delay(200);
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    this.tasks.splice(index, 1);
    this._invalidateCache();
    return true;
  }

async getByCategory(categoryId) {
    const cacheKey = this._getCacheKey('getByCategory', categoryId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    await delay(250);
    const result = this.tasks.filter(t => t.categoryId === categoryId).map(t => ({ ...t }));
    this.cache.set(cacheKey, result);
    return result;
  }

async getCompleted() {
    const cacheKey = this._getCacheKey('getCompleted');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    await delay(250);
    const result = this.tasks.filter(t => t.completed).map(t => ({ ...t }));
    this.cache.set(cacheKey, result);
    return result;
  }

async getPending() {
    const cacheKey = this._getCacheKey('getPending');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    await delay(250);
    const result = this.tasks.filter(t => !t.completed).map(t => ({ ...t }));
    this.cache.set(cacheKey, result);
    return result;
  }
}

export default new TaskService();