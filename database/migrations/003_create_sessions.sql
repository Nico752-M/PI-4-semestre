CREATE TABLE IF NOT EXISTS sesion (
  token_hash CHAR(64) PRIMARY KEY,
  id_persona INT NOT NULL,
  expira_en TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_sesion_persona FOREIGN KEY (id_persona)
    REFERENCES persona(id_persona) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sesion_persona
ON sesion (id_persona);

CREATE INDEX IF NOT EXISTS idx_sesion_expiracion
ON sesion (expira_en);
