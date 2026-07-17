# Sistema Bancario

Desarrollé este proyecto como parte de mi formación en Ingeniería Informática, con el objetivo de construir algo que fuera más allá de un CRUD básico. Quería entender cómo funciona realmente un sistema financiero por dentro — desde la autenticación segura hasta las transferencias atómicas y el cálculo de crédito — y documentarlo de forma que cualquier reclutador o colaborador pudiera entenderlo y ejecutarlo sin fricciones.

El resultado es una plataforma bancaria fullstack con dos roles bien definidos: el **cliente**, que puede gestionar sus cuentas, mover dinero y monitorear su score crediticio; y el **ejecutivo**, que tiene visibilidad total del sistema con herramientas de gestión y análisis.

---

## ¿Qué puedes hacer con este sistema?

### Como cliente
- Registrarte e iniciar sesión de forma segura con JWT
- Si te equivocas 5 veces con la contraseña, la cuenta se bloquea 5 minutos automáticamente
- Ver tu balance total y movimientos recientes desde el dashboard
- Abrir cuentas de ahorro o corriente, y cerrarlas cuando tengan saldo cero
- Hacer transferencias a otras cuentas — si algo falla a la mitad, el dinero no desaparece
- Depositar y retirar dinero con historial paginado
- Solicitar tarjetas débito o crédito con fecha de corte y límite de pago
- Ver tu score crediticio calculado automáticamente según tu comportamiento
- Recibir notificaciones internas de cada operación importante

### Como ejecutivo (ADMIN)
- Ver estadísticas globales: usuarios, cuentas, dinero total en el sistema, transacciones del día
- Consultar y gestionar todos los usuarios con sus cuentas y balances
- Bloquear o desbloquear cuentas y enviar notificación automática al usuario
- Acreditar depósitos manualmente a cualquier cuenta
- Ajustar el score crediticio de cualquier usuario
- Revisar el historial completo de transacciones del sistema con paginación
- Ver logs de seguridad con los intentos de login fallidos y desbloquear usuarios
- Analizar el sistema con gráficas interactivas: actividad diaria, tipos de transacción, distribución de scores y saldos por tipo de cuenta
- Promover usuarios al rol de ejecutivo

---

## Stack tecnológico

### Backend
| Tecnología | Versión |
|---|---|
| Java | 17 / 21 |
| Spring Boot | 4.1.0 |
| Spring Security + JWT | JJWT 0.11.5 |
| Spring Data JPA + Hibernate | 7.4.x |
| MySQL | 8.0 |
| Maven | 3.x |
| Springdoc OpenAPI (Swagger) | 2.8.9 |

### Frontend
| Tecnología | Versión |
|---|---|
| React | 18 |
| TypeScript | 5.x |
| Vite | 5.x |
| Tailwind CSS | 3.x |
| Axios | 1.x |
| Recharts | 2.x |
| React Router DOM | 6.x |

---

## Cómo está organizado el backend

Seguí una arquitectura en capas limpia para que cada responsabilidad esté bien separada:

```
Controller → Service → Repository → Entity → MySQL
```

```
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
```

---

## Instalación

### Lo que necesitas tener instalado
- Java 17 o superior
- Maven 3.x
- MySQL 8.0
- Node.js 18+

### Backend

```bash
# Clona el repositorio
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
```

### Frontend

```bash
cd banco-frontend
npm install
npm run dev
```

### Crear tu primer usuario ejecutivo

Después de registrarte normalmente, ejecuta esto en MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'tu@email.com';
```

La documentación interactiva de la API está disponible en `http://localhost:8080/swagger-ui.html` una vez que el backend esté corriendo.

---

## Endpoints principales

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registro | ❌ |
| POST | `/api/auth/login` | Login + JWT | ❌ |
| GET | `/api/accounts` | Mis cuentas | ✅ |
| POST | `/api/accounts` | Abrir cuenta | ✅ |
| POST | `/api/transactions/transfer` | Transferir | ✅ |
| POST | `/api/transactions/deposit` | Depositar | ✅ |
| POST | `/api/transactions/withdraw` | Retirar | ✅ |
| GET | `/api/transactions/history/{account}/paged` | Historial paginado | ✅ |
| POST | `/api/cards` | Solicitar tarjeta | ✅ |
| GET | `/api/credit-score` | Mi score | ✅ |
| GET | `/api/notifications` | Notificaciones | ✅ |
| GET | `/api/admin/stats` | Estadísticas globales | 🔐 |
| GET | `/api/admin/users` | Todos los usuarios | 🔐 |
| GET | `/api/admin/transactions` | Historial global | 🔐 |
| GET | `/api/admin/charts` | Datos para gráficas | 🔐 |
| GET | `/api/admin/security/logs` | Logs de seguridad | 🔐 |

---

## Cómo funciona el score crediticio

El score se recalcula automáticamente cada vez que el usuario solicita una tarjeta de crédito o consulta su perfil. No es un número fijo — refleja su comportamiento real con el banco.

| Factor | Impacto |
|---|---|
| Antigüedad de cuentas | Hasta +150 puntos |
| Saldo promedio entre cuentas | Hasta +200 puntos |
| Número de transacciones exitosas | Hasta +200 puntos |
| Transacciones fallidas por saldo insuficiente | Hasta -100 puntos |

Con ese score, el límite de crédito se asigna automáticamente:

| Rating | Rango | Límite |
|---|---|---|
| EXCELENTE | 740 – 850 | $50,000 |
| BUENO | 670 – 739 | $25,000 |
| REGULAR | 580 – 669 | $10,000 |
| MALO | 300 – 579 | $3,000 |

---

## Algunas decisiones técnicas que vale la pena mencionar

**`@Transactional` en transferencias** — Si el sistema falla entre el descuento de la cuenta origen y el abono a la destino, MySQL revierte todo automáticamente. El dinero nunca queda en el aire.

**Soft delete en cuentas** — Las cuentas cerradas no se borran de la base de datos. Se marcan como eliminadas con fecha de cierre. Esto mantiene la integridad del historial de transacciones.

**Score dinámico** — El límite de crédito no lo define el ejecutivo manualmente (aunque puede ajustarlo). Lo calcula el sistema con base en el historial real del usuario, lo que hace el proceso más objetivo.

**Bloqueo por intentos fallidos** — El sistema registra cada intento fallido de login. Al quinto, bloquea el acceso durante 5 minutos y notifica al usuario. El ejecutivo puede desbloquearlo manualmente desde su panel.

---

## Autor

**Francisco González Martínez**  
Estudiante de Ingeniería Informática — TESSFP, Estado de México  
[GitHub](https://github.com/Frgm-Mx) · pakogmartinez@hotmail.com
