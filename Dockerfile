FROM python:alpine
COPY tip.py /tip.py
RUN apt-get install libmagic1
RUN pip install PyGithub python-magic --progress-bar off
ENTRYPOINT ["/tip.py"]
