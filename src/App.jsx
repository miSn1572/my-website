import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'my-todo-tasks'

const today = () => new Date().toISOString().slice(0, 10)

const formatDate = (dateStr) => {
  const t = today()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  if (dateStr === t) return `今日 (${dateStr.slice(5).replace('-', '/')})`
  if (dateStr === tomorrowStr) return `明日 (${dateStr.slice(5).replace('-', '/')})`
  return dateStr.slice(5).replace('-', '/')
}

const groupByDate = (tasks) => {
  const t = today()
  const groups = {}

  tasks.forEach(task => {
    const key = task.dueDate || '__none__'
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  })

  // ソート: 期限切れ → 今日以降（昇順）→ 日付なし
  const sorted = Object.keys(groups).sort((a, b) => {
    if (a === '__none__') return 1
    if (b === '__none__') return -1
    return a.localeCompare(b)
  })

  return sorted.map(key => ({
    key,
    label: key === '__none__' ? '日付なし' : formatDate(key),
    overdue: key !== '__none__' && key < t,
    tasks: groups[key],
  }))
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Reactを学ぶ', done: false, dueDate: today() },
      { id: 2, text: 'TODOアプリを作る', done: false, dueDate: '' },
    ]
  })
  const [input, setInput] = useState('')
  const [inputDate, setInputDate] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingDate, setEditingDate] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setTasks([...tasks, { id: Date.now(), text: trimmed, done: false, dueDate: inputDate }])
    setInput('')
    setInputDate('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditingText(task.text)
    setEditingDate(task.dueDate || '')
  }

  const saveEdit = () => {
    const trimmed = editingText.trim()
    if (!trimmed) return
    setTasks(tasks.map(task =>
      task.id === editingId ? { ...task, text: trimmed, dueDate: editingDate } : task
    ))
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.done
    if (filter === 'done') return task.done
    return true
  })

  const groups = groupByDate(filteredTasks)

  return (
    <div className="todo-app">
      <h1>TODO アプリ</h1>

      {/* タスク入力 */}
      <div className="input-area">
        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="タスクを入力..."
          />
          <button onClick={addTask}>追加</button>
        </div>
        <div className="date-row">
          <label>締切日：</label>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
          />
        </div>
      </div>

      {/* フィルター */}
      <div className="filter-row">
        {['all', 'active', 'done'].map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'すべて' : f === 'active' ? '未完了' : '完了'}
          </button>
        ))}
      </div>

      {/* グループ表示 */}
      {groups.length === 0 && (
        <p className="empty">タスクがありません</p>
      )}
      {groups.map(group => (
        <div key={group.key} className={`group ${group.overdue ? 'overdue' : ''}`}>
          <div className="group-header">
            <span className="group-icon">{group.overdue ? '🔴' : '📅'}</span>
            <span className="group-label">
              {group.overdue ? `期限切れ — ${group.label}` : group.label}
            </span>
            <span className="group-count">{group.tasks.length}件</span>
          </div>
          <ul className="task-list">
            {group.tasks.map(task => (
              <li key={task.id} className={[
                task.done ? 'done' : '',
                group.overdue && !task.done ? 'overdue-task' : '',
              ].join(' ')}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                {editingId === task.id ? (
                  <div className="edit-row">
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
                    <button className="save" onClick={saveEdit}>保存</button>
                    <button className="cancel" onClick={cancelEdit}>キャンセル</button>
                  </div>
                ) : (
                  <>
                    <span>{task.text}</span>
                    <button className="edit" onClick={() => startEdit(task)}>編集</button>
                    <button className="delete" onClick={() => deleteTask(task.id)}>削除</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="count">残り {tasks.filter(t => !t.done).length} 件</p>
    </div>
  )
}

export default App
