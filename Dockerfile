FROM python:alpine
COPY tip.py /tip.py
RUN apk add libmagic
RUN pip install PyGithub python-magic --progress-bar off
ENTRYPOINT ["/tip.py"]
