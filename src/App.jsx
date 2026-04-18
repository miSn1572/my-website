import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'my-todo-tasks'
const today = () => new Date().toISOString().slice(0, 10)

const COLUMNS = [
  { status: 'todo',       label: '未着手', color: '#8c8c8c' },
  { status: 'inprogress', label: '作業中', color: '#1890ff' },
  { status: 'done',       label: '完了',   color: '#52c41a' },
]

const PRIORITY = {
  high:   { label: '高', color: '#ff4d4f' },
  medium: { label: '中', color: '#faad14' },
  low:    { label: '低', color: '#1890ff' },
  none:   { label: 'なし', color: '#d9d9d9' },
}

const STATUS_PREV = { inprogress: 'todo', done: 'inprogress' }
const STATUS_NEXT = { todo: 'inprogress', inprogress: 'done' }

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Reactを学ぶ',      status: 'inprogress', dueDate: today(), priority: 'high' },
      { id: 2, text: 'TODOアプリを作る', status: 'todo',       dueDate: '',      priority: 'medium' },
    ]
  })

  const [input, setInput] = useState('')
  const [inputDate, setInputDate] = useState('')
  const [inputPriority, setInputPriority] = useState('medium')

  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [editingPriority, setEditingPriority] = useState('medium')

  const [draggedId, setDraggedId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setTasks([...tasks, {
      id: Date.now(),
      text: trimmed,
      status: 'todo',
      dueDate: inputDate,
      priority: inputPriority,
    }])
    setInput('')
    setInputDate('')
    setInputPriority('medium')
  }

  const changeStatus = (id, status) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, status } : task))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditingText(task.text)
    setEditingDate(task.dueDate || '')
    setEditingPriority(task.priority || 'medium')
  }

  const saveEdit = () => {
    const trimmed = editingText.trim()
    if (!trimmed) return
    setTasks(tasks.map(task =>
      task.id === editingId
        ? { ...task, text: trimmed, dueDate: editingDate, priority: editingPriority }
        : task
    ))
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  // ドラッグ & ドロップ
  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  const handleDrop = (e, status) => {
    e.preventDefault()
    if (draggedId !== null) {
      setTasks(tasks.map(task =>
        task.id === draggedId ? { ...task, status } : task
      ))
    }
    setDraggedId(null)
    setDragOverStatus(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverStatus(null)
  }

  const t = today()

  const getColumnTasks = (status) =>
    tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })

  const dueDateState = (dueDate, status) => {
    if (status === 'done' || !dueDate) return null
    if (dueDate < t) return 'overdue'
    if (dueDate === t) return 'due-today'
    return null
  }

  return (
    <div className="app-layout">

      {/* サイドバー */}
      <aside className="sidebar">
        <h2>タスクを追加</h2>

        <div className="sidebar-form">
          <label>タスク名</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="タスクを入力..."
          />

          <label>締切日</label>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
          />

          <label>優先度</label>
          <select value={inputPriority} onChange={(e) => setInputPriority(e.target.value)}>
            <option value="high">🔴 高</option>
            <option value="medium">🟡 中</option>
            <option value="low">🔵 低</option>
            <option value="none">⚪ なし</option>
          </select>

          <button className="btn-add" onClick={addTask}>＋ 追加</button>
        </div>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span>全タスク</span>
            <span>{tasks.length}件</span>
          </div>
          <div className="stat-item">
            <span>未完了</span>
            <span>{tasks.filter(t => t.status !== 'done').length}件</span>
          </div>
          <div className="stat-item overdue-stat">
            <span>期限切れ</span>
            <span>{tasks.filter(t => t.dueDate && t.dueDate < today() && t.status !== 'done').length}件</span>
          </div>
        </div>
      </aside>

      {/* カンバンボード */}
      <main className="board">
        {COLUMNS.map(col => {
          const colTasks = getColumnTasks(col.status)
          const isDragOver = dragOverStatus === col.status

          return (
            <div
              key={col.status}
              className={`column ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              onDragLeave={() => setDragOverStatus(null)}
            >
              <div className="column-header" style={{ borderTopColor: col.color }}>
                <span className="column-title" style={{ color: col.color }}>{col.label}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <ul className="task-list">
                {colTasks.length === 0 && (
                  <li className="column-empty">タスクなし</li>
                )}
                {colTasks.map(task => {
                  const dateState = dueDateState(task.dueDate, task.status)
                  const prevStatus = STATUS_PREV[task.status]
                  const nextStatus = STATUS_NEXT[task.status]
                  const prevLabel = COLUMNS.find(c => c.status === prevStatus)?.label
                  const nextLabel = COLUMNS.find(c => c.status === nextStatus)?.label

                  return (
                    <li
                      key={task.id}
                      className={[
                        'task-card',
                        dateState || '',
                        draggedId === task.id ? 'dragging' : '',
                      ].join(' ')}
                      style={{ borderLeftColor: PRIORITY[task.priority || 'none'].color }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {editingId === task.id ? (
                        <div className="edit-form">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit()
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            autoFocus
                          />
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                          />
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value)}
                          >
                            <option value="high">🔴 高</option>
                            <option value="medium">🟡 中</option>
                            <option value="low">🔵 低</option>
                            <option value="none">⚪ なし</option>
                          </select>
                          <div className="edit-actions">
                            <button className="btn-save" onClick={saveEdit}>保存</button>
                            <button className="btn-cancel" onClick={cancelEdit}>キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="card-top">
                            <span className="task-text">{task.text}</span>
                            <div className="card-icons">
                              <button className="btn-icon" onClick={() => startEdit(task)} title="編集">✏️</button>
                              <button className="btn-icon btn-icon-delete" onClick={() => deleteTask(task.id)} title="削除">🗑️</button>
                            </div>
                          </div>

                          <div className="card-meta">
                            {task.dueDate && (
                              <span className={`badge badge-date ${dateState || ''}`}>
                                📅 {task.dueDate.slice(5).replace('-', '/')}
                                {dateState === 'overdue'   && ' ⚠'}
                                {dateState === 'due-today' && ' 今日'}
                              </span>
                            )}
                            {task.priority && task.priority !== 'none' && (
                              <span
                                className="badge badge-priority"
                                style={{ background: PRIORITY[task.priority].color }}
                              >
                                {PRIORITY[task.priority].label}
                              </span>
                            )}
                          </div>

                          <div className="card-actions">
                            {prevStatus && (
                              <button
                                className="btn-status btn-prev"
                                onClick={() => changeStatus(task.id, prevStatus)}
                              >
                                ← {prevLabel}
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                className="btn-status btn-next"
                                onClick={() => changeStatus(task.id, nextStatus)}
                              >
                                {nextLabel} →
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </main>
    </div>
  )
}

export default App
