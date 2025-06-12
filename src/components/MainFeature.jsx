import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isPast, parseISO } from 'date-fns';
import ApperIcon from './ApperIcon';

function MainFeature({
  tasks,
  categories,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  draggedTask,
  onDragStart,
  onDragEnd
}) {
  const [quickAddText, setQuickAddText] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const quickAddRef = useRef(null);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    onAddTask({
      title: quickAddText.trim(),
      completed: false,
      priority: 'medium',
      categoryId: categories[0]?.id || null,
      dueDate: null
    });
    
    setQuickAddText('');
    quickAddRef.current?.focus();
  };

  const handleTaskComplete = async (task) => {
    const completedAt = !task.completed ? new Date().toISOString() : null;
    await onUpdateTask(task.id, { 
      completed: !task.completed,
      completedAt
    });
  };

  const handleEditStart = (task) => {
    setEditingTask(task.id);
    setEditText(task.title);
  };

  const handleEditSubmit = async (task) => {
    if (editText.trim() && editText !== task.title) {
      await onUpdateTask(task.id, { title: editText.trim() });
    }
    setEditingTask(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditText('');
  };

  const handleDragStart = (e, task, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    onDragStart({ task, index });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedTask && draggedTask.index !== targetIndex) {
      onReorderTasks(
        draggedTask.index,
        targetIndex,
        draggedTask.task.categoryId,
        draggedTask.task.categoryId
      );
    }
    onDragEnd();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-accent';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'None';
    }
  };

  const isOverdue = (task) => {
    return !task.completed && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
  };

const { activeTasks, completedTasks, displayTasks, sortedTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);
    const display = showCompleted ? tasks : active;
    
    const sorted = [...display].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.order - b.order;
    });
    
    return {
      activeTasks: active,
      completedTasks: completed,
      displayTasks: display,
      sortedTasks: sorted
    };
  }, [tasks, showCompleted]);

  if (tasks.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col">
        {/* Quick Add Bar */}
        <motion.form
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onSubmit={handleQuickAdd}
          className="mb-8"
        >
          <div className="relative">
            <ApperIcon 
              name="Plus" 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
            />
            <input
              ref={quickAddRef}
              type="text"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder="Add a new task..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </motion.form>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="mb-6"
            >
              <ApperIcon name="CheckSquare" className="w-24 h-24 text-gray-300 mx-auto" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading">Ready to be productive?</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Start by adding your first task above. You can organize them by category, 
              set priorities, and track your progress throughout the day.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => quickAddRef.current?.focus()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
              Add Your First Task
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col max-w-full overflow-hidden">
      {/* Quick Add Bar */}
      <motion.form
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleQuickAdd}
        className="mb-6"
      >
        <div className="relative">
          <ApperIcon 
            name="Plus" 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
          />
          <input
            ref={quickAddRef}
            type="text"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder="Add a new task..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
          />
        </div>
      </motion.form>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <ApperIcon 
            name="Search" 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showCompleted
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </motion.button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task, index) => {
            const category = categories.find(cat => cat.id === task.categoryId);
            const overdue = isOverdue(task);
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                draggable
                onDragStart={(e) => handleDragStart(e, task, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                  dragOverIndex === index ? 'border-primary/50 bg-primary/5' : ''
                } ${
                  task.completed 
                    ? 'opacity-70 bg-gray-50' 
                    : overdue 
                      ? 'border-l-error' 
                      : `border-l-[${category?.color || '#6B7280'}]`
                }`}
                style={{
                  borderLeftColor: task.completed 
                    ? '#6B7280' 
                    : overdue 
                      ? '#FF6B6B' 
                      : category?.color || '#6B7280'
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTaskComplete(task)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${
                      task.completed
                        ? 'bg-success border-success completion-burst'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {task.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <ApperIcon name="Check" className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {editingTask === task.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSubmit(task);
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          onBlur={() => handleEditSubmit(task)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditSubmit(task)}
                            className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                          >
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEditCancel}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 
                            className={`font-medium break-words ${
                              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}
                            onClick={() => handleEditStart(task)}
                          >
                            {task.title}
                          </h3>
                          
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            {/* Priority Badge */}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} ${
                                task.priority === 'high' && !task.completed ? 'priority-pulse' : ''
                              }`}
                              title={`${getPriorityLabel(task.priority)} Priority`}
                            />
                            
                            {/* Actions */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditStart(task)}
                              className="p-1 text-gray-400 hover:text-primary transition-colors"
                            >
                              <ApperIcon name="Edit2" size={16} />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-error transition-colors"
                            >
                              <ApperIcon name="Trash2" size={16} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          {category && (
                            <div className="flex items-center space-x-1">
                              <ApperIcon name={category.icon} size={14} />
                              <span>{category.name}</span>
                            </div>
                          )}
                          
                          {task.dueDate && (
                            <div className={`flex items-center space-x-1 ${
                              overdue ? 'text-error font-medium' : ''
                            }`}>
                              <ApperIcon name="Calendar" size={14} />
                              <span>
                                {isToday(parseISO(task.dueDate)) 
                                  ? 'Today' 
                                  : format(parseISO(task.dueDate), 'MMM d')
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedTasks.length === 0 && (tasks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <ApperIcon name="Search" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks match your filters</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-white rounded-xl border border-gray-200"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {activeTasks.length} pending, {completedTasks.length} completed
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-success font-medium">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% complete
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MainFeature;