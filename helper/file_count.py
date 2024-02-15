import os

def get_file_count(folder_path):
    return len([name for name in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, name))])

# Verwendung
# folder_path = '/pfad/zu/ihrem/ordner'
# file_count = get_file_count(folder_path)
# print(f"Anzahl der Dateien im Ordner '{folder_path}': {file_count}")
