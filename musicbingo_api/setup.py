"""Setup file for musicbingo-api package."""
from setuptools import setup, find_packages

setup(
    name="musicbingo-api",
    version="0.1.0",
    description="Backend API for Music Bingo game management and verification",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.0.0",
        "sqlalchemy>=2.0.0",
        "python-multipart>=0.0.6",
    ],
)
