# Developed By : Ali Khodarahmi

from flask import Flask, render_template, request, jsonify
from datetime import datetime, timezone, timedelta
import sqlite3

app = Flask(__name__)

DATABASE = 'todo.db'

TEHRAN_TZ = timezone(timedelta(hours=3, minutes=30))

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            completed INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'medium',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            due_date TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def task_to_dict(task):
    """Convert database row to dictionary"""
    created_at = datetime.fromisoformat(task['created_at']).replace(tzinfo=timezone.utc).astimezone(TEHRAN_TZ) if task['created_at'] else None
    return {
        'id': task['id'],
        'title': task['title'],
        'description': task['description'],
        'completed': bool(task['completed']),
        'priority': task['priority'],
        'created_at': created_at.strftime('%Y-%m-%d %H:%M') if created_at else '',
        'due_date': task['due_date']
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    filter_status = request.args.get('filter', 'all')
    
    conn = get_db_connection()
    
    if filter_status == 'active':
        tasks = conn.execute('SELECT * FROM tasks WHERE completed = 0 ORDER BY created_at DESC').fetchall()
    elif filter_status == 'completed':
        tasks = conn.execute('SELECT * FROM tasks WHERE completed = 1 ORDER BY created_at DESC').fetchall()
    else:
        tasks = conn.execute('SELECT * FROM tasks ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([task_to_dict(task) for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    if not data or 'title' not in data or not data['title'].strip():
        return jsonify({'error': 'Title is required'}), 400
    title = data['title'].strip()
    description = data.get('description', '').strip()
    priority = data.get('priority', 'medium')
    due_date = data.get('due_date', None)
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO tasks (title, description, priority, due_date) VALUES (?, ?, ?, ?)',
        (title, description, priority, due_date)
    )
    task_id = cursor.lastrowid
    conn.commit()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    return jsonify(task_to_dict(task)), 201


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    conn = get_db_connection()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    updates = []
    params = []
    
    if 'title' in data:
        updates.append('title = ?')
        params.append(data['title'].strip())
    
    if 'description' in data:
        updates.append('description = ?')
        params.append(data['description'].strip())
    
    if 'completed' in data:
        updates.append('completed = ?')
        params.append(1 if data['completed'] else 0)
    
    if 'priority' in data:
        updates.append('priority = ?')
        params.append(data['priority'])
    
    if 'due_date' in data:
        updates.append('due_date = ?')
        params.append(data['due_date'] if data['due_date'] else None)
    
    if updates:
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        params.append(task_id)
        conn.execute(query, params)
        conn.commit()
        
    updated_task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    return jsonify(task_to_dict(updated_task))

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    conn = get_db_connection()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/tasks/<int:task_id>/toggle', methods=['PATCH'])
def toggle_task(task_id):
    conn = get_db_connection()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    new_status = 0 if task['completed'] else 1
    conn.execute('UPDATE tasks SET completed = ? WHERE id = ?', (new_status, task_id))
    conn.commit()
    updated_task = conn.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    return jsonify(task_to_dict(updated_task))

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    total = conn.execute('SELECT COUNT(*) as count FROM tasks').fetchone()['count']
    completed = conn.execute('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').fetchone()['count']
    active = conn.execute('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').fetchone()['count']
    conn.close()
    return jsonify({
        'total': total,
        'completed': completed,
        'active': active,
        'completion_rate': round((completed / total * 100) if total > 0 else 0, 1)
    })
    
if __name__ == '__main__':
    print("="*60)
    print("🚀 AquaTask - Professional To-Do List Application")
    print("👨‍💻 Developed by: Ali Khodarahmi")
    print("="*60)
    print("✅ Database initialized successfully")
    print("="*60)
    app.run(debug=True, host='0.0.0.0', port=5000)
