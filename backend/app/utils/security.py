"""
Security utility functions for password hashing and verification.
"""
import bcrypt

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    :param password: Plain text password
    :return: Hashed password
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    :param plain_password: Plain text password to verify
    :param hashed_password: Hashed password to verify against
    :return: True if password matches, False otherwise
    """
    plain_password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)