// Leaders and Departments List
export const LEADERS = [
  {
    name: 'Selene Díez',
    department: 'Dirección General'
  },
  {
    name: 'Karina Rodríguez Palos',
    department: 'Dirección del Centro de Servicios Compartidos'
  },
  {
    name: 'Diana Mejía',
    department: 'Coordinación de Atracción, Retención y Éxito del Talento, Capital Humano'
  },
  {
    name: 'Ibrahím Núñez',
    department: 'Coordinación de Administración del CH, Payroll & Compliance, Capital Humano'
  },
  {
    name: 'Edgar Ayala',
    department: 'Coordinación de Servicios de Administración'
  },
  {
    name: 'Ana Tejada',
    department: 'Coordinación de Pre-venta, Comercial'
  },
  {
    name: 'Martha Isabel Párez García',
    department: 'Coordinación de Servicio Desk y Servicio a Cliente, Operaciones'
  },
  {
    name: 'Marcos Daniel Reyes',
    department: 'Agile PMO, Operaciones'
  },
  {
    name: 'Joseph Mumanga',
    department: 'Centro de Innovación y Desarrollo (CID), Ingeniería'
  },
  {
    name: 'Carlos Daniel Omelas',
    department: 'Coordinación de Infraestructura y Seguridad, Ingeniería'
  },
  {
    name: 'Jesús Díez',
    department: 'Marketing Estratégico B2B, Comercial'
  },
  {
    name: 'Benjamin Jaimes Carrizosa',
    department: 'Líder Técnico, Operaciones'
  }
];

// Helper function to get leader by name
export const getLeaderByName = (name) => {
  return LEADERS.find(leader => leader.name === name);
};

// Helper function to get all leader names
export const getLeaderNames = () => {
  return LEADERS.map(leader => leader.name);
};

