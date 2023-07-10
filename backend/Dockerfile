# Use an official Python runtime as the base image
FROM python:3.9-slim



COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


COPY . .


EXPOSE 5000


CMD ["python", "server.py"]
