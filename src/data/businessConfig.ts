// Configuración del negocio para el Dashboard
export const BUSINESS_INFO = {
  nombre: "Renova Fácil",
  web: "www.renovafacil.store",

  producto_principal: {
    nombre: "Placas Autoadhesivas 3D Símil Ladrillo",
    dimensiones: "77 x 70 cm por placa",
    presentacion: "Pack de 10 unidades",
    cobertura: "5.39 m² por pack",
    precio_actual: "$69.942",
    precio_anterior: "$119.990",
    descuento: "42%",
    colores_disponibles: ["Blanco texturado", "Negro", "Gris", "Madera", "Mármol (70x70cm)", "Ladrillo"],
    caracteristicas: [
      "Efecto 3D realista",
      "Impermeables",
      "Ultra resistentes",
      "Fácil de limpiar",
      "Sin obra ni polvo",
      "Autoadhesivas"
    ],
  },

  otros_productos: [
    {
      nombre: "Placas Símil Mármol 30x60",
      precio: "$45.000",
      cobertura: "1.8 m²"
    },
    {
      nombre: "Paneles de Follaje Artificial",
      precio: "$15.000",
      medidas: "50x50cm"
    }
  ],

  envios: {
    costo: "GRATIS a todo el país",
    tiempo_caba_amba: "3-6 días hábiles",
    tiempo_interior: "3-8 días hábiles",
    empresa: "Andreani",
    despacho: "1-2 días hábiles después de la compra"
  },

  pagos: {
    cuotas: "3 cuotas sin interés",
    metodos: ["Tarjeta de crédito", "Tarjeta de débito", "Transferencia", "Mercado Pago"]
  },

  garantia: {
    dias_devolucion: "30 días",
    condiciones: "Producto sin usar, en su empaque original"
  },

  contacto: {
    whatsapp: "+54 9 11 1234-5678",
    email: "contacto@renovafacil.store",
    horario_atencion: "Lunes a Viernes de 9 a 18hs"
  },

  instalacion: {
    dificultad: "Muy fácil, no requiere herramientas",
    pasos: [
      "Limpiar la superficie (debe estar seca y libre de polvo)",
      "Despegar el adhesivo de la placa",
      "Pegar desde una esquina presionando firmemente",
      "Se puede cortar con tijera o trincheta para ajustar"
    ],
    superficies_recomendadas: ["Paredes lisas", "Azulejos", "Durlock", "Cemento alisado"],
    superficies_no_recomendadas: ["Paredes con humedad", "Superficies con pintura descascarada"]
  }
};
