from flask import Flask, url_for, render_template, request, redirect, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from flaskext.markdown import Markdown
from flask_cors import CORS
import os, hashlib, json

UPLOAD_FOLDER = os.path.abspath("./uploads")
ALLOWED_EXTENSIONS = set(["png", "jpg", "jpge"])

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

app = Flask(__name__, template_folder="templates")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

Markdown(app)

@app.route('/')
def principal():
    content = ""
    with open("./markdown/bienvenido.md", "r", encoding="utf-8") as f:
        content = f.read()
    return render_template('index.html', contenido=content, ext_permitidas=ALLOWED_EXTENSIONS)

@app.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('404.html'), 404

@app.route('/upload', methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        for item in request.files:
            f = request.files[item]
            if f.filename == "":
                return "No hay archivo seleccionado"
            if f and allowed_file(f.filename):
                filename = secure_filename(f.filename)
                #Habría que verificar si la carpeta existe, si no, crearla
                if not os.path.exists(os.path.join(app.config["UPLOAD_FOLDER"])):
                    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"]))
                f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                return "¡Archivo cargado exitósamente!"
            return "Tipo de archivo no permitido."
    return render_template('upload.html')

@app.route("/listado", methods=["POST"])
def get_listado():
    archivos_y_hash = []
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        return jsonify()
    for root, dirs, files in os.walk(app.config["UPLOAD_FOLDER"]):
        for names in files:
            md5 = hashlib.md5()
            filepath = os.path.join(root, names)
            fl = open (filepath, 'rb')
            buf = fl.read()
            md5.update(buf)
            fl.close()
            archivos_y_hash.append([names, md5.hexdigest()])
    return jsonify(archivos_y_hash)

@app.route("/eliminar/<nombre>", methods=["POST"])
def delete_file(nombre):
    if (os.path.exists(os.path.join(app.config["UPLOAD_FOLDER"], nombre))):
        try:
            os.remove(os.path.join(app.config["UPLOAD_FOLDER"], nombre))
            return "Procesado."
        except:
            return "No se pudo eliminar"
    return "No existe"

if __name__ == '__main__':
    app.run(debug=True, port=8000)
