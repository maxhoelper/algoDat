import os

def delete_files_in_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                # Wenn Sie auch Unterverzeichnisse löschen möchten, können Sie hier shutil.rmtree verwenden
                pass
        except Exception as e:
            print(f"Fehler beim Löschen von {file_path}. Grund: {e}")

# Verwendung
# folder_path = '/pfad/zu/ihrem/ordner'
# delete_files_in_folder(folder_path)
