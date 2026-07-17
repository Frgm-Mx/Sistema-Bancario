# Sistema-Bancario
Sistema Bancario

Desarrollé este proyecto como parte de mi formación en Ingeniería Informática, con el objetivo de construir algo que fuera más allá de un CRUD básico. Quería entender cómo funciona realmente un sistema financiero por dentro — desde la autenticación segura hasta las transferencias atómicas y el cálculo de crédito — y documentarlo de forma que cualquier reclutador o colaborador pudiera entenderlo y ejecutarlo sin fricciones.

El resultado es una plataforma bancaria fullstack con dos roles bien definidos: el cliente, que puede gestionar sus cuentas, mover dinero y monitorear su score crediticio; y el ejecutivo, que tiene visibilidad total del sistema con herramientas de gestión y análisis.


¿Qué puedes hacer con este sistema?

Como cliente


Registrarte e iniciar sesión de forma segura con JWT
Si te equivocas 5 veces con la contraseña, la cuenta se bloquea 5 minutos automáticamente
Ver tu balance total y movimientos recientes desde el dashboard
Abrir cuentas de ahorro o corriente, y cerrarlas cuando tengan saldo cero
Hacer transferencias a otras cuentas — si algo falla a la mitad, el dinero no desaparece
Depositar y retirar dinero con historial paginado
Solicitar tarjetas débito o crédito con fecha de corte y límite de pago
Ver tu score crediticio calculado automáticamente según tu comportamiento
Recibir notificaciones internas de cada operación importante


Como ejecutivo (ADMIN)


Ver estadísticas globales: usuarios, cuentas, dinero total en el sistema, transacciones del día
Consultar y gestionar todos los usuarios con sus cuentas y balances
Bloquear o desbloquear cuentas y enviar notificación automática al usuario
Acreditar depósitos manualmente a cualquier cuenta
Ajustar el score crediticio de cualquier usuario
Revisar el historial completo de transacciones del sistema con paginación
Ver logs de seguridad con los intentos de login fallidos y desbloquear usuarios
Analizar el sistema con gráficas interactivas: actividad diaria, tipos de transacción, distribución de scores y saldos por tipo de cuenta
Promover usuarios al rol de ejecutivo



Stack tecnológico

Backend

TecnologíaVersiónJava17 / 21Spring Boot4.1.0Spring Security + JWTJJWT 0.11.5Spring Data JPA + Hibernate7.4.xMySQL8.0Maven3.xSpringdoc OpenAPI (Swagger)2.8.9

Frontend

TecnologíaVersiónReact18TypeScript5.xVite5.xTailwind CSS3.xAxios1.xRecharts2.xReact Router DOM6.x


Cómo está organizado el backend

Seguí una arquitectura en capas limpia para que cada responsabilidad esté bien separada:

Controller → Service → Repository → Entity → MySQL

com.banco.sistemabancario
├── config/          # Seguridad, CORS, Swagger, manejo global de excepciones
├── controller/      # Auth, Cuentas, Transacciones, Tarjetas,
│                    # Score, Notificaciones, Admin
├── dto/             # Objetos de entrada y salida de la API
├── entity/          # User, Account, Transaction, Card,
│                    # CreditScore, Notification, LoginAttempt
├── repository/      # Interfaces JPA
├── security/        # JwtService, JwtFilter, UserDetailsServiceImpl
└── service/         # Lógica de negocio de cada módulo


Instalación

Lo que necesitas tener instalado


Java 17 o superior
Maven 3.x
MySQL 8.0
Node.js 18+


Backend

bash# Clona el repositorio
git clone https://github.com/Frgm-Mx/Sistema-Bancario.git
cd Sistema-Bancario/sistema-bancario

# Crea la base de datos en MySQL
CREATE DATABASE banco_db;

# Configura tus credenciales en application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/banco_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD

# Levanta el servidor
mvn spring-boot:run

Frontend

bashcd banco-frontend
npm install
npm run dev

Crear tu primer usuario ejecutivo

Después de registrarte normalmente, ejecuta esto en MySQL:

sqlUPDATE users SET role = 'ADMIN' WHERE email = 'tu@email.com';

La documentación interactiva de la API está disponible en http://localhost:8080/swagger-ui.html una vez que el backend esté corriendo.


Endpoints principales

MétodoEndpointDescripciónAuthPOST/api/auth/registerRegistro❌POST/api/auth/loginLogin + JWT❌GET/api/accountsMis cuentas✅POST/api/accountsAbrir cuenta✅POST/api/transactions/transferTransferir✅POST/api/transactions/depositDepositar✅POST/api/transactions/withdrawRetirar✅GET/api/transactions/history/{account}/pagedHistorial paginado✅POST/api/cardsSolicitar tarjeta✅GET/api/credit-scoreMi score✅GET/api/notificationsNotificaciones✅GET/api/admin/statsEstadísticas globales🔐GET/api/admin/usersTodos los usuarios🔐GET/api/admin/transactionsHistorial global🔐GET/api/admin/chartsDatos para gráficas🔐GET/api/admin/security/logsLogs de seguridad🔐


Cómo funciona el score crediticio

El score se recalcula automáticamente cada vez que el usuario solicita una tarjeta de crédito o consulta su perfil. No es un número fijo — refleja su comportamiento real con el banco.

FactorImpactoAntigüedad de cuentasHasta +150 puntosSaldo promedio entre cuentasHasta +200 puntosNúmero de transacciones exitosasHasta +200 puntosTransacciones fallidas por saldo insuficienteHasta -100 puntos

Con ese score, el límite de crédito se asigna automáticamente:

RatingRangoLímiteEXCELENTE740 – 850$50,000BUENO670 – 739$25,000REGULAR580 – 669$10,000MALO300 – 579$3,000


Algunas decisiones técnicas que vale la pena mencionar

@Transactional en transferencias — Si el sistema falla entre el descuento de la cuenta origen y el abono a la destino, MySQL revierte todo automáticamente. El dinero nunca queda en el aire.

Soft delete en cuentas — Las cuentas cerradas no se borran de la base de datos. Se marcan como eliminadas con fecha de cierre. Esto mantiene la integridad del historial de transacciones.

Score dinámico — El límite de crédito no lo define el ejecutivo manualmente (aunque puede ajustarlo). Lo calcula el sistema con base en el historial real del usuario, lo que hace el proceso más objetivo.

Bloqueo por intentos fallidos — El sistema registra cada intento fallido de login. Al quinto, bloquea el acceso durante 5 minutos y notifica al usuario. El ejecutivo puede desbloquearlo manualmente desde su panel.


Autor

Francisco González Martínez
Estudiante de Ingeniería Informática — TESSFP, Estado de México
GitHub · pakogmartinez@hotmail.com
