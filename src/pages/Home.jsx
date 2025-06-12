import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '../components/ApperIcon';
import MainFeature from '../components/MainFeature';
import { taskService, categoryService } from '../services';

function Home() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, categoriesData] = await Promise.all([
        taskService.getAll(),
        categoryService.getAll()
      ]);
      setTasks(tasksData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const newTask = await taskService.create({
        ...taskData,
        order: tasks.length,
        createdAt: new Date().toISOString()
      });
      setTasks(prev => [...prev, newTask]);
      toast.success('Task added successfully');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const updatedTask = await taskService.update(id, updates);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      if (updates.completed) {
        toast.success('Task completed! 🎉');
      } else {
        toast.success('Task updated');
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskService.delete(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const reorderTasks = async (sourceIndex, destIndex, sourceCategoryId, destCategoryId) => {
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(sourceIndex, 1);
    
    if (sourceCategoryId !== destCategoryId) {
      movedTask.categoryId = destCategoryId;
    }
    
    newTasks.splice(destIndex, 0, movedTask);
    
    // Update order values
    newTasks.forEach((task, index) => {
      task.order = index;
    });
    
    setTasks(newTasks);
    
    try {
      await taskService.update(movedTask.id, movedTask);
      toast.success('Task moved');
    } catch (err) {
      toast.error('Failed to move task');
      loadData(); // Reload on error
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = activeCategory === 'all' || task.categoryId === activeCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && task.completed) ||
      (statusFilter === 'pending' && !task.completed) ||
      (statusFilter === 'overdue' && !task.completed && task.dueDate && new Date(task.dueDate) < new Date());
    
    return matchesCategory && matchesSearch && matchesPriority && matchesStatus;
  });

  const completedToday = tasks.filter(task => 
    task.completed && 
    task.completedAt && 
    new Date(task.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const totalTasks = tasks.filter(task => !task.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedToday / (completedToday + totalTasks)) * 100) : 0;

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 bg-white border-r border-gray-200 p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md mx-4"
        >
          <ApperIcon name="AlertCircle" className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header with Quick Add */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <ApperIcon name="CheckSquare" className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 font-heading">TaskFlow</h1>
              <p className="text-sm text-gray-600 truncate">Organize and complete daily tasks efficiently</p>
            </div>
          </div>
          
          {/* Progress Ring */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-16 h-16 flex-shrink-0"
          >
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-200"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeLinecap="round"
                className="text-primary"
                initial={{ strokeDasharray: "0 175.93" }}
                animate={{ 
                  strokeDasharray: `${(progressPercentage / 100) * 175.93} 175.93` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">
                {progressPercentage}%
              </span>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory('all')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeCategory === 'all'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ApperIcon name="Inbox" size={20} />
                <span className="font-medium">All Tasks</span>
                <span className={`ml-auto text-sm px-2 py-1 rounded-full ${
                  activeCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tasks.length}
                </span>
              </motion.button>

              {categories.map(category => {
                const categoryTasks = tasks.filter(task => task.categoryId === category.id);
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeCategory === category.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <ApperIcon name={category.icon} size={20} />
                    <span className="font-medium truncate">{category.name}</span>
                    <span className={`ml-auto text-sm px-2 py-1 rounded-full ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {categoryTasks.length}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl"
            >
              <h3 className="font-semibold text-gray-900 mb-3">Today's Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-success">{completedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-gray-900">{totalTasks}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <MainFeature
            tasks={filteredTasks}
            categories={categories}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onReorderTasks={reorderTasks}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            draggedTask={draggedTask}
            onDragStart={setDraggedTask}
            onDragEnd={() => setDraggedTask(null)}
          />
        </main>
      </div>
    </div>
  );
}

export default Home;