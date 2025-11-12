'''
Business: Google OAuth authentication with database session management
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict
'''

import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import urllib.request
import psycopg

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters', {}) or {}
    action = query_params.get('action', '')
    
    if method == 'POST' and action == 'google':
        return handle_google_callback(event, cors_headers)
    
    if method == 'GET' and action == 'me':
        return get_current_user(event, cors_headers)
    
    if method == 'POST' and action == 'logout':
        return handle_logout(event, cors_headers)
    
    return {
        'statusCode': 404,
        'headers': cors_headers,
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }

def handle_google_callback(event: Dict[str, Any], cors_headers: Dict[str, str]) -> Dict[str, Any]:
    try:
        body_raw = event.get('body')
        
        if body_raw is None or body_raw == '':
            body_data = {}
        elif isinstance(body_raw, dict):
            body_data = body_raw
        elif isinstance(body_raw, str):
            body_data = json.loads(body_raw) if body_raw.strip() else {}
        else:
            body_data = {}
        
        access_token = body_data.get('access_token') if isinstance(body_data, dict) else None
        
        if not access_token:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing access_token'}),
                'isBase64Encoded': False
            }
        
        req = urllib.request.Request(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read().decode())
        
        google_id = user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        
        if not google_id or not email:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Invalid user info from Google'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM users WHERE google_id = %s",
                    (google_id,)
                )
                user = cur.fetchone()
                
                if user:
                    user_id = user[0]
                    cur.execute(
                        "UPDATE users SET email = %s, name = %s, picture = %s WHERE id = %s",
                        (email, name, picture, user_id)
                    )
                else:
                    cur.execute(
                        "INSERT INTO users (google_id, email, name, picture) VALUES (%s, %s, %s, %s) RETURNING id",
                        (google_id, email, name, picture)
                    )
                    user_id = cur.fetchone()[0]
                
                session_token = secrets.token_urlsafe(32)
                expires_at = datetime.utcnow() + timedelta(days=30)
                
                cur.execute(
                    "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                    (user_id, session_token, expires_at)
                )
                
                conn.commit()
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'session_token': session_token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'picture': picture
                }
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_current_user(event: Dict[str, Any], cors_headers: Dict[str, str]) -> Dict[str, Any]:
    try:
        headers = event.get('headers', {})
        session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
        
        if not session_token:
            return {
                'statusCode': 401,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Not authenticated'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.email, u.name, u.picture, s.expires_at
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.session_token = %s
                """, (session_token,))
                
                result = cur.fetchone()
                
                if not result:
                    return {
                        'statusCode': 401,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Invalid session'}),
                        'isBase64Encoded': False
                    }
                
                user_id, email, name, picture, expires_at = result
                
                if expires_at < datetime.utcnow():
                    return {
                        'statusCode': 401,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Session expired'}),
                        'isBase64Encoded': False
                    }
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'picture': picture
                }
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def handle_logout(event: Dict[str, Any], cors_headers: Dict[str, str]) -> Dict[str, Any]:
    try:
        headers = event.get('headers', {})
        session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
        
        if not session_token:
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Logged out'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE sessions SET expires_at = NOW() WHERE session_token = %s",
                    (session_token,)
                )
                conn.commit()
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'Logged out successfully'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }