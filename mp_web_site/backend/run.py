from mp_web_site.backend.database.operations import UserRepository
repo = UserRepository()
repo.create_table_if_not_exists()