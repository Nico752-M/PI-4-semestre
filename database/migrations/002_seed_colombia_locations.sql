INSERT INTO pais (nombre)
SELECT 'Colombia'
WHERE NOT EXISTS (
  SELECT 1 FROM pais WHERE lower(nombre) = lower('Colombia')
);

WITH colombia AS (
  SELECT id_pais
  FROM pais
  WHERE lower(nombre) = lower('Colombia')
  ORDER BY id_pais
  LIMIT 1
),
departamentos(nombre) AS (
  VALUES
    ('Bogotá D.C.'),
    ('Antioquia'),
    ('Valle del Cauca'),
    ('Atlántico'),
    ('Santander')
)
INSERT INTO departamento (nombre, id_pais)
SELECT departamentos.nombre, colombia.id_pais
FROM colombia
CROSS JOIN departamentos
WHERE NOT EXISTS (
  SELECT 1
  FROM departamento existente
  WHERE existente.id_pais = colombia.id_pais
    AND lower(existente.nombre) = lower(departamentos.nombre)
);

WITH colombia AS (
  SELECT id_pais
  FROM pais
  WHERE lower(nombre) = lower('Colombia')
  ORDER BY id_pais
  LIMIT 1
),
ubicaciones(ciudad, departamento) AS (
  VALUES
    ('Bogotá', 'Bogotá D.C.'),
    ('Medellín', 'Antioquia'),
    ('Cali', 'Valle del Cauca'),
    ('Barranquilla', 'Atlántico'),
    ('Bucaramanga', 'Santander')
)
INSERT INTO ciudad (nombre, id_departamento)
SELECT ubicaciones.ciudad, d.id_departamento
FROM ubicaciones
JOIN departamento d
  ON lower(d.nombre) = lower(ubicaciones.departamento)
JOIN colombia
  ON d.id_pais = colombia.id_pais
WHERE NOT EXISTS (
  SELECT 1
  FROM ciudad existente
  WHERE existente.id_departamento = d.id_departamento
    AND lower(existente.nombre) = lower(ubicaciones.ciudad)
);
