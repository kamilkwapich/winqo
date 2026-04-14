from __future__ import annotations
import smtplib
import ssl
import imaplib
from email.message import EmailMessage
from typing import Any
from sqlmodel import Session
from app.core.config import settings
from app.db.models import GlobalBillingSettings, Tenant

def get_email_settings(session: Session) -> GlobalBillingSettings:
    row = session.get(GlobalBillingSettings, 1)
    if not row:
        row = GlobalBillingSettings(id=1)
        session.add(row)
        session.commit()
        session.refresh(row)
    return row

def send_email(settings_row: GlobalBillingSettings, to_email: str, subject: str, body: str) -> None:
    if not settings_row.smtp_host or not settings_row.smtp_user or not settings_row.smtp_password:
        raise ValueError("SMTP not configured")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings_row.smtp_from or settings_row.smtp_user
    msg["To"] = to_email
    msg.set_content(body)

    context = ssl.create_default_context()
    if settings_row.smtp_tls:
        with smtplib.SMTP(settings_row.smtp_host, settings_row.smtp_port or 587) as server:
            server.starttls(context=context)
            server.login(settings_row.smtp_user, settings_row.smtp_password)
            server.send_message(msg)
    else:
        with smtplib.SMTP_SSL(settings_row.smtp_host, settings_row.smtp_port or 465, context=context) as server:
            server.login(settings_row.smtp_user, settings_row.smtp_password)
            server.send_message(msg)

def build_verification_link(lang: str, token: str) -> str:
    return f"{settings.web_base_url}/{lang}/verify-email?token={token}"

def send_verification_email(session: Session, to_email: str, token: str, lang: str = "en") -> None:
    settings_row = get_email_settings(session)
    link = build_verification_link(lang, token)
    
    # Simple localization map for subjects/body (could be moved to i18n files properly later)
    subjects = {
        "pl": "Winqo - Potwierdź adres email",
        "en": "Winqo - Verify your email",
        "en-us": "Winqo - Verify your email",
        "de": "Winqo - E-Mail-Adresse bestätigen",
        "es": "Winqo - Verifica tu correo electrónico",
        "it": "Winqo - Verifica il tuo indirizzo email",
        "fr": "Winqo - Vérifiez votre adresse email",
    }
    msgs = {
         "pl": f"""
Witaj!

Aby dokończyć rejestrację w systemie Winqo, kliknij w poniższy link:

{link}

Link jest ważny przez 24 godziny.

Pozdrawiamy,
Zespół Winqo
""",
        "en": f"""
Welcome!

To complete your registration at Winqo, please click the link below:

{link}

The link is valid for 24 hours.

Best regards,
Winqo Team
""",
        "de": f"""
Willkommen!

Um Ihre Registrierung bei Winqo abzuschließen, klicken Sie bitte auf den untenstehenden Link:

{link}

Der Link ist 24 Stunden gültig.

Mit freundlichen Grüßen,
Ihr Winqo-Team
""",
       "es": f"""
¡Bienvenido!

Para completar su registro en Winqo, haga clic en el siguiente enlace:

{link}

El enlace es válido por 24 horas.

Saludos cordiales,
Equipo Winqo
""",
       "it": f"""
Benvenuto!

Per completare la registrazione su Winqo, clicca sul link sottostante:

{link}

Il link è valido per 24 ore.

Cordiali saluti,
Il team di Winqo
""",
       "fr": f"""
Bienvenue !

Pour finaliser votre inscription sur Winqo, veuillez cliquer sur le lien ci-dessous :

{link}

Le lien est valable 24 heures.

Cordialement,
L'équipe Winqo
"""
    }
    
    subject = subjects.get(lang, subjects["en"])
    body = msgs.get(lang, msgs["en"])

    send_email(settings_row, to_email, subject, body)

def build_reset_link(lang: str, token: str) -> str:
    return f"{settings.web_base_url}/{lang}/reset-password?token={token}"

def send_password_reset_email(session: Session, to_email: str, token: str, lang: str = "en") -> None:
    settings_row = get_email_settings(session)
    link = build_reset_link(lang, token)
    
    subjects = {
        "pl": "Winqo - Resetowanie hasła",
        "en": "Winqo - Password Reset",
        "en-us": "Winqo - Password Reset",
        "de": "Winqo - Passwort zurücksetzen",
        "es": "Winqo - Restablecer contraseña",
        "it": "Winqo - Reimposta password",
        "fr": "Winqo - Réinitialiser le mot de passe",
    }
    
    msgs = {
        "pl": f"""
Cześć!

Otrzymaliśmy prośbę o zresetowanie hasła. Kliknij w poniższy link, aby ustawić nowe hasło:

{link}

Jeśli to nie Ty wysłałeś prośbę, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół Winqo
""",
        "en": f"""
Hi!

We received a request to reset your password. Click the link below to set a new password:

{link}

If you did not request this, please ignore this email.

Best regards,
Winqo Team
""",
        "de": f"""
Hallo!

Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf den untenstehenden Link, um ein neues Passwort festzulegen:

{link}

Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail bitte.

Mit freundlichen Grüßen,
Ihr Winqo-Team
""",
        "es": f"""
¡Hola!

Recibimos una solicitud para restablecer su contraseña. Haga clic en el siguiente enlace para establecer una nueva contraseña:

{link}

Si no solicitó esto, ignore este correo electrónico.

Saludos cordiales,
Equipo Winqo
""",
        "it": f"""
Ciao!

Abbiamo ricevuto una richiesta per reimpostare la tua password. Clicca sul link sottostante per impostare una nuova password:

{link}

Se non hai richiesto questo, ignora questa email.

Cordiali saluti,
Il team di Winqo
""",
        "fr": f"""
Bonjour !

Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :

{link}

Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.

Cordialement,
L'équipe Winqo
"""
    }

    subject = subjects.get(lang, subjects["en"])
    body = msgs.get(lang, msgs["en"])

    send_email(settings_row, to_email, subject, body)

def build_payment_link(token: str, lang: str = "en") -> str:
    return f"{settings.web_base_url}/{lang}/payment-required?token={token}"

def send_payment_link_email(session: Session, tenant: Tenant, to_email: str, token: str) -> None:
    settings_row = get_email_settings(session)
    lang = tenant.default_lang or "en"
    link = build_payment_link(token, lang)

    subjects = {
        "pl": "Winqo - Dokończ płatność",
        "en": "Winqo - Complete payment",
        "en-us": "Winqo - Complete payment",
        "de": "Winqo - Zahlung abschließen",
        "es": "Winqo - Completar el pago",
        "it": "Winqo - Completa il pagamento",
        "fr": "Winqo - Finaliser le paiement",
    }
    
    msgs = {
        "pl": f"""
Witaj!

Dziękujemy za rejestrację. Aby aktywować konto, prosimy o dokonanie płatności.
Kliknij w poniższy link, aby kontynuować:

{link}

Pozdrawiamy,
Zespół Winqo
""",
        "en": f"""
Welcome!

Thank you for registering. To activate your account, please complete the payment.
Click the link below to continue:

{link}

Best regards,
Winqo Team
""",
        "de": f"""
Willkommen!

Vielen Dank für Ihre Registrierung. Um Ihr Konto zu aktivieren, schließen Sie bitte die Zahlung ab.
Klicken Sie auf den untenstehenden Link, um fortzufahren:

{link}

Mit freundlichen Grüßen,
Ihr Winqo-Team
""",
       "es": f"""
¡Bienvenido!

Gracias por registrarse. Para activar su cuenta, complete el pago.
Haga clic en el enlace a continuación para continuar:

{link}

Saludos cordiales,
Equipo Winqo
""",
        "it": f"""
Benvenuto!

Grazie per esserti registrato. Per attivare il tuo account, completa il pagamento.
Clicca sul link sottostante per continuare:

{link}

Cordiali saluti,
Il team di Winqo
""",
        "fr": f"""
Bienvenue !

Merci de vous être inscrit. Pour activer votre compte, veuillez effectuer le paiement.
Cliquez sur le lien ci-dessous pour continuer :

{link}

Cordialement,
L'équipe Winqo
"""
    }

    subject = subjects.get(lang, subjects["en"])
    body = msgs.get(lang, msgs["en"])

    send_email(settings_row, to_email, subject, body)

def test_email_settings(session: Session, payload: dict[str, Any]) -> dict[str, Any]:
    settings_row = get_email_settings(session)
    smtp_ok = False
    smtp_error = None
    imap_ok = False
    imap_error = None
    if settings_row.smtp_host and settings_row.smtp_user and settings_row.smtp_password:
        try:
            context = ssl.create_default_context()
            if settings_row.smtp_tls:
                with smtplib.SMTP(settings_row.smtp_host, settings_row.smtp_port or 587, timeout=15) as server:
                    server.starttls(context=context)
                    server.login(settings_row.smtp_user, settings_row.smtp_password)
            else:
                with smtplib.SMTP_SSL(settings_row.smtp_host, settings_row.smtp_port or 465, context=context, timeout=15) as server:
                    server.login(settings_row.smtp_user, settings_row.smtp_password)
            smtp_ok = True
        except Exception as exc:  # pragma: no cover
            smtp_error = str(exc)
    if settings_row.imap_host and settings_row.imap_user and settings_row.imap_password:
        try:
            if settings_row.imap_tls:
                client = imaplib.IMAP4_SSL(settings_row.imap_host, settings_row.imap_port or 993)
            else:
                client = imaplib.IMAP4(settings_row.imap_host, settings_row.imap_port or 143)
            client.login(settings_row.imap_user, settings_row.imap_password)
            client.logout()
            imap_ok = True
        except Exception as exc:  # pragma: no cover
            imap_error = str(exc)

    test_email = payload.get("test_email")
    if test_email and smtp_ok:
        try:
            send_email(settings_row, test_email, "Winqo SMTP test", "SMTP configuration test successful.")
        except Exception as exc:  # pragma: no cover
            smtp_ok = False
            smtp_error = str(exc)

    return {
        "smtp_ok": smtp_ok,
        "smtp_error": smtp_error,
        "imap_ok": imap_ok,
        "imap_error": imap_error,
    }
