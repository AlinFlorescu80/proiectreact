import { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { CSSTransition, TransitionGroup } from "react-transition-group";

function App() {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newHour, setNewHour] = useState("00:00");
  const [newPriority, setNewPriority] = useState("Low");

  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editHour, setEditHour] = useState("00:00");
  const [editPriority, setEditPriority] = useState("Low");
  const [sortCriteria, setSortCriteria] = useState("title");

  const tasksCollectionRef = collection(db, "tasks");

  const createTask = async () => {
    await addDoc(tasksCollectionRef, {
      title: newTitle,
      description: newDescription,
      dueDate: newDueDate,
      hour: newHour,
      priority: newPriority,
      completed: false,
    });
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setNewHour("00:00");
    setNewPriority("Low");
    fetchTasks();
  };

  const updateTask = async (id, updatedFields) => {
    const taskDoc = doc(db, "tasks", id);
    await updateDoc(taskDoc, updatedFields);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    const taskDoc = doc(db, "tasks", id);
    await deleteDoc(taskDoc);
    fetchTasks();
  };

  const fetchTasks = async () => {
    const data = await getDocs(tasksCollectionRef);
    const tasksList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setTasks(sortTasks(tasksList, sortCriteria));
  };

  useEffect(() => {
    fetchTasks();
  }, [sortCriteria]);

  const sortTasks = (tasks, criteria) => {
    const sortedTasks = tasks.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      switch (criteria) {
        case "title":
          return a.title.localeCompare(b.title);
        case "dueDate":
          return new Date(a.dueDate) - new Date(b.dueDate);
        case "priority":
          const priorityOrder = { "Low": 1, "Medium": 2, "High": 3 };
          return priorityOrder[b.priority] - priorityOrder[a.priority]; 
        default:
          return 0;
      }
    });
    return sortedTasks;
  };

  const toggleCompletion = async (task) => {
    const updatedFields = { completed: !task.completed };
    const newTasks = tasks.filter((t) => t.id !== task.id);
    setTasks(newTasks);
    await updateTask(task.id, updatedFields);
    setTimeout(fetchTasks, 500); 
  };

  return (
    <div className="App">
      <h1>Task Manager</h1>
      <div>
        <input
          placeholder="Task Title..."
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <textarea
          placeholder="Task Description..."
          value={newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(event) => setNewDueDate(event.target.value)}
        />
        <input
          type="time"
          value={newHour}
          onChange={(event) => setNewHour(event.target.value)}
        />
        <select
          value={newPriority}
          onChange={(event) => setNewPriority(event.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button onClick={createTask}>Create Task</button>
      </div>
      <div>
        <label>Sort by: </label>
        <select onChange={(e) => setSortCriteria(e.target.value)} value={sortCriteria}>
          <option value="title">Title</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
      <TransitionGroup>
        {tasks.map((task) => {
          const isEditing = task.id === editingTaskId;

          return (
            <CSSTransition
              key={task.id}
              timeout={500}
              classNames="task"
            >
              <div className={`task ${isEditing ? 'editing' : ''} ${task.completed ? 'completed' : ''}`}>
                {isEditing ? (
                  <div>
                    <input
                      value={editTitle}
                      placeholder="New Title..."
                      onChange={(event) => setEditTitle(event.target.value)}
                    />
                    <textarea
                      value={editDescription}
                      placeholder="New Description..."
                      onChange={(event) => setEditDescription(event.target.value)}
                    />
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(event) => setEditDueDate(event.target.value)}
                    />
                    <input
                      type="time"
                      value={editHour}
                      onChange={(event) => setEditHour(event.target.value)}
                    />
                    <select
                      value={editPriority}
                      onChange={(event) => setEditPriority(event.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <button
                      onClick={() => {
                        const updatedFields = {
                          title: editTitle,
                          description: editDescription,
                          dueDate: editDueDate,
                          hour: editHour,
                          priority: editPriority,
                        };
                        updateTask(task.id, updatedFields);
                        setEditingTaskId(null);
                      }}
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingTaskId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <h2>{task.title}</h2>
                    <p>Description: {task.description}</p>
                    <p>Due Date: {task.dueDate}</p>
                    <p>Hour: {task.hour}</p>
                    <p>Priority: {task.priority}</p>
                    <div className="task-footer">
                      <label>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleCompletion(task)}
                        />
                        Completed
                      </label>
                      <div>
                        <button
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditTitle(task.title);
                            setEditDescription(task.description);
                            setEditDueDate(task.dueDate);
                            setEditHour(task.hour);
                            setEditPriority(task.priority);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Sigur vrei sa stergi asta varule?")) {
                              deleteTask(task.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          );
        })}
      </TransitionGroup>
    </div>
  );
}

export default App;
