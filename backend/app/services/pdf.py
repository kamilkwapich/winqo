from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
from pathlib import Path

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)

TEMPLATE_VARIANTS = {
    "classic": "quote.html",
    "wow": "quote_wow.html",
    "copy": "quote_copy.html",
    "premium": "quote_premium.html",
}

COLOR_TRANSLATIONS = {
    "biały": {"pl": "Biały", "en": "White", "fr": "Blanc", "de": "Weiß", "es": "Blanco", "it": "Bianco"},
    "srebrny": {"pl": "Srebrny", "en": "Silver", "fr": "Argent", "de": "Silber", "es": "Plateado", "it": "Argento"},
    "brązowy": {"pl": "Brązowy", "en": "Brown", "fr": "Marron", "de": "Braun", "es": "Marrón", "it": "Marrone"},
    "antracyt": {"pl": "Antracyt", "en": "Anthracite", "fr": "Anthracite", "de": "Anthrazit", "es": "Antracita", "it": "Antracite"},
    "złoty dąb": {"pl": "Złoty dąb", "en": "Golden Oak", "fr": "Chêne doré", "de": "Goldene Eiche", "es": "Roble dorado", "it": "Rovere dorato"},
    "winchester": {"pl": "Winchester", "en": "Winchester", "fr": "Winchester", "de": "Winchester", "es": "Winchester", "it": "Winchester"},
    "zielony": {"pl": "Zielony", "en": "Green", "fr": "Vert", "de": "Grün", "es": "Verde", "it": "Verde"},
    "złoty połysk": {"pl": "Złoty połysk", "en": "Polished gold", "fr": "Or brillant", "de": "Glanzgold", "es": "Oro brillo", "it": "Oro lucido"},
    "stare złoto": {"pl": "Stare złoto", "en": "Antique gold", "fr": "Or ancien", "de": "Antikgold", "es": "Oro envejecido", "it": "Oro antico"},
}

GLASS_TRANSLATIONS = {
    "4/16/4 float": {"pl": "4/16/4 Float", "en": "4/16/4 Float", "fr": "4/16/4 Float", "de": "4/16/4 Float", "es": "4/16/4 Float", "it": "4/16/4 Float"},
    "4/16/4 low-e": {"pl": "4/16/4 Low-E", "en": "4/16/4 Low-E", "fr": "4/16/4 Low-E", "de": "4/16/4 Low-E", "es": "4/16/4 Low-E", "it": "4/16/4 Low-E"},
    "4/16/4/16/4 triple": {"pl": "4/16/4/16/4 Triple", "en": "4/16/4/16/4 Triple", "fr": "4/16/4/16/4 Triple", "de": "4/16/4/16/4 Dreifach", "es": "4/16/4/16/4 Triple", "it": "4/16/4/16/4 Triplo"},
    "33.1/16/4 bezpieczne": {"pl": "33.1/16/4 Bezpieczne", "en": "33.1/16/4 Safety", "fr": "33.1/16/4 Sécurité", "de": "33.1/16/4 Sicherheit", "es": "33.1/16/4 Seguridad", "it": "33.1/16/4 Sicurezza"},
}

def money(cents: int, currency: str = "EUR") -> str:
    value = cents / 100.0
    return f"{value:,.2f} {currency}".replace(",", " ").replace(".", ",")

TRANSLATIONS = {
    "en": {
        "quote": "Quote",
        "quote_name": "Name",
        "quote_number": "Number",
        "company": "Company",
        "summary": "Summary",
        "date": "Date",
        "client": "Client",
        "items": "Items",
        "drawing": "Drawing",
        "position": "Pos.",
        "qty": "Qty",
        "unit": "Net price",
        "total": "Net total",
        "subtotal": "Subtotal",
        "discount": "Discount",
        "grand_total": "Total",
        "no_client": "No client selected",
        "window_type": "Window type",
        "window_type_1": "1-sash window",
        "window_type_2": "2-sash window",
        "window_type_3": "3-sash window",
        "dimensions": "Dimensions",
        "hardware": "Hardware",
        "opening": "Opening",
        "glass": "Glass",
        "system": "System",
        "profile_color": "Profile color",
        "thermal_transmittance": "Thermal transmittance",
        "glass_double": "Double glazing",
        "glass_triple": "Triple glazing",
        "glass_spec": "Glass spec",
        "frame_split": "Frame split",
        "movable": "Movable",
        "center_post": "Center post",
        "center_post_fixed": "Fixed",
        "center_post_movable": "Movable",
        "sash": "Sash",
        "sash_type": "Sash type",
        "handle": "Handle",
        "handle_color": "Handle color",
        "handle_side": "Handle side",
        "slide_direction": "Slide direction",
        "left": "Left",
        "right": "Right",
        "control_side": "Control side",
        "box_height": "Box height",
        "drive": "Drive",
        "color": "Color",
        "pane_type_fix": "Fixed (fix)",
        "pane_type_casement": "Casement",
        "pane_type_tilt_turn": "Tilt & turn",
        "pane_type_tilt": "Tilt",
        "pane_type_sliding": "Sliding",
        "window_shape": "Window shape",
        "window_shape_rect": "Rectangular",
        "window_shape_round": "Round",
        "window_shape_arch": "Arched",
        "window_shape_trapezoid": "Trapezoid",
        "phone": "Phone",
        "email": "Email",
        "website": "Website",
        "notes": "Notes",
        "transport": "Transport",
        "installation": "Installation",
        "extra_costs": "Extra costs",
        "vat": "VAT",
        "vat_rate": "VAT rate",
        "item_type_window": "Window",
        "item_type_shutter": "Roller shutter",
        "item_type_door": "Interior door",
        "item_type_okiennica": "Shutter panel",
        "item_type_text": "Text only",
        "door_color": "Door color",
        "okiennica_lamella_type": "Lamella type",
        "okiennica_lamella_fixed": "Fixed lamella",
        "okiennica_lamella_movable": "Movable lamella",
        "okiennica_horizontal_bars": "Horizontal bars",
        "drive_manual": "Manual",
        "drive_motor": "Motor",
        "branding_footer": "Generated with Winqo — window quotations in minutes.",
        "pdf_generated_with": "Quote generated with Winqo",
        "page_label": "Page",
    },
    "pl": {
        "quote": "Wycena",
        "quote_name": "Nazwa",
        "quote_number": "Numer",
        "company": "Firma",
        "summary": "Podsumowanie",
        "date": "Data",
        "client": "Klient",
        "items": "Pozycje",
        "drawing": "Rysunek",
        "position": "Poz.",
        "qty": "Ilość",
        "unit": "Cena netto",
        "total": "Suma netto",
        "subtotal": "Suma częściowa",
        "discount": "Rabat",
        "grand_total": "Razem",
        "no_client": "Brak wybranego klienta",
        "window_type": "Typ okna",
        "window_type_1": "Okno 1-skrzydłowe",
        "window_type_2": "Okno 2-skrzydłowe",
        "window_type_3": "Okno 3-skrzydłowe",
        "dimensions": "Wymiary",
        "hardware": "Okucie",
        "opening": "Otwieranie",
        "glass": "Szyba",
        "system": "System",
        "profile_color": "Kolor profilu",
        "thermal_transmittance": "Wsp. przenikania ciepła",
        "glass_double": "Szyba podwójna",
        "glass_triple": "Szyba potrójna",
        "glass_spec": "Specyfikacja",
        "frame_split": "Podział ramy",
        "movable": "Ruchomy",
        "center_post": "Słupek środkowy",
        "center_post_fixed": "Stały",
        "center_post_movable": "Ruchomy",
        "sash": "Skrzydło",
        "sash_type": "Typ skrzydła",
        "handle": "Klamka",
        "handle_color": "Kolor klamki",
        "handle_side": "Strona klamki",
        "slide_direction": "Kierunek przesuwu",
        "left": "Lewe",
        "right": "Prawe",
        "control_side": "Strona sterowania",
        "box_height": "Wysokość skrzynki",
        "drive": "Napęd",
        "color": "Kolor",
        "pane_type_fix": "Stałe (fix)",
        "pane_type_casement": "Rozwierne",
        "pane_type_tilt_turn": "Rozwierno-uchylne",
        "pane_type_tilt": "Uchylne",
        "pane_type_sliding": "Przesuwne",
        "window_shape": "Forma okna",
        "window_shape_rect": "Prostokątne",
        "window_shape_round": "Okrągłe",
        "window_shape_arch": "Łuk",
        "window_shape_trapezoid": "Trapez",
        "phone": "Telefon",
        "email": "E-mail",
        "website": "WWW",
        "notes": "Notatki",
        "transport": "Transport",
        "installation": "Montaż",
        "extra_costs": "Dodatkowe koszty",
        "vat": "VAT",
        "vat_rate": "Stawka VAT",
        "item_type_window": "Okno",
        "item_type_shutter": "Roleta",
        "item_type_door": "Drzwi wewnętrzne",
        "item_type_okiennica": "Okiennica",
        "item_type_text": "Tekst",
        "door_color": "Kolor drzwi",
        "okiennica_lamella_type": "Typ lameli",
        "okiennica_lamella_fixed": "Lamela stała",
        "okiennica_lamella_movable": "Lamela ruchoma",
        "okiennica_horizontal_bars": "Poprzeczki poziome",
        "drive_manual": "Ręczny",
        "drive_motor": "Silnik",
        "branding_footer": "Wycena wygenerowana w Winqo — wyceny okien w kilka minut.",
        "pdf_generated_with": "Oferta wygenerowana w Winqo",
        "page_label": "Strona",
    },
    "fr": {
        "quote": "Devis",
        "quote_name": "Nom",
        "quote_number": "Numéro",
        "company": "Entreprise",
        "summary": "Résumé",
        "date": "Date",
        "client": "Client",
        "items": "Lignes",
        "drawing": "Dessin",
        "position": "Pos.",
        "qty": "Qté",
        "unit": "Prix net",
        "total": "Total net",
        "subtotal": "Sous-total",
        "discount": "Remise",
        "grand_total": "Total",
        "no_client": "Aucun client sélectionné",
        "window_type": "Type de fenêtre",
        "window_type_1": "Fenêtre 1 vantail",
        "window_type_2": "Fenêtre 2 vantaux",
        "window_type_3": "Fenêtre 3 vantaux",
        "dimensions": "Dimensions",
        "hardware": "Ferrure",
        "opening": "Ouverture",
        "glass": "Vitrage",
        "system": "Système",
        "profile_color": "Couleur du profil",
        "thermal_transmittance": "Transmittance thermique",
        "glass_double": "Double vitrage",
        "glass_triple": "Triple vitrage",
        "glass_spec": "Composition du vitrage",
        "frame_split": "Répartition du cadre",
        "movable": "Mobile",
        "center_post": "Montant central",
        "center_post_fixed": "Fixe",
        "center_post_movable": "Mobile",
        "sash": "Vantail",
        "sash_type": "Type de vantail",
        "handle": "Poignée",
        "handle_color": "Couleur de poignée",
        "handle_side": "Côté poignée",
        "slide_direction": "Sens de glissement",
        "left": "Gauche",
        "right": "Droite",
        "control_side": "Côté de commande",
        "box_height": "Hauteur du caisson",
        "drive": "Commande",
        "color": "Couleur",
        "pane_type_fix": "Fixe (fix)",
        "pane_type_casement": "Battant",
        "pane_type_tilt_turn": "Oscillo-battant",
        "pane_type_tilt": "Oscillant",
        "pane_type_sliding": "Coulissant",
        "window_shape": "Forme de fenêtre",
        "window_shape_rect": "Rectangulaire",
        "window_shape_round": "Ronde",
        "window_shape_arch": "Cintrée",
        "window_shape_trapezoid": "Trapèze",
        "phone": "Téléphone",
        "email": "Email",
        "website": "Site web",
        "notes": "Notes",
        "transport": "Transport",
        "installation": "Pose",
        "extra_costs": "Frais supplémentaires",
        "vat": "TVA",
        "vat_rate": "Taux de TVA",
        "item_type_window": "Fenêtre",
        "item_type_shutter": "Volet roulant",
        "item_type_door": "Porte intérieure",
        "item_type_text": "Texte",
        "door_color": "Couleur de la porte",
        "drive_manual": "Manuel",
        "drive_motor": "Moteur",
        "branding_footer": "Devis généré avec Winqo — devis fenêtres en quelques minutes.",
        "pdf_generated_with": "Devis généré avec Winqo",
        "page_label": "Page",
    },
    "de": {
        "quote": "Angebot",
        "quote_name": "Name",
        "quote_number": "Nummer",
        "company": "Firma",
        "summary": "Zusammenfassung",
        "date": "Datum",
        "client": "Kunde",
        "items": "Positionen",
        "drawing": "Zeichnung",
        "position": "Pos.",
        "qty": "Menge",
        "unit": "Nettopreis",
        "total": "Nettobetrag",
        "subtotal": "Zwischensumme",
        "discount": "Rabatt",
        "grand_total": "Gesamt",
        "no_client": "Kein Kunde ausgewählt",
        "window_type": "Fenstertyp",
        "window_type_1": "1-flügeliges Fenster",
        "window_type_2": "2-flügeliges Fenster",
        "window_type_3": "3-flügeliges Fenster",
        "dimensions": "Abmessungen",
        "hardware": "Beschlag",
        "opening": "Öffnung",
        "glass": "Glas",
        "system": "System",
        "profile_color": "Profilfarbe",
        "thermal_transmittance": "Wärmedurchgang",
        "glass_double": "Doppelverglasung",
        "glass_triple": "Dreifachverglasung",
        "glass_spec": "Glasaufbau",
        "frame_split": "Sprossenaufteilung",
        "movable": "Beweglich",
        "center_post": "Mittelpfosten",
        "center_post_fixed": "Fest",
        "center_post_movable": "Beweglich",
        "sash": "Flügel",
        "sash_type": "Flügeltyp",
        "handle": "Griff",
        "handle_color": "Grifffarbe",
        "handle_side": "Griffseite",
        "slide_direction": "Schieberichtung",
        "left": "Links",
        "right": "Rechts",
        "control_side": "Bedienseite",
        "box_height": "Kastenhöhe",
        "drive": "Antrieb",
        "color": "Farbe",
        "pane_type_fix": "Fest (fix)",
        "pane_type_casement": "Drehflügel",
        "pane_type_tilt_turn": "Dreh-Kipp",
        "pane_type_tilt": "Kipp",
        "pane_type_sliding": "Schiebe",
        "window_shape": "Fensterform",
        "window_shape_rect": "Rechteckig",
        "window_shape_round": "Rund",
        "window_shape_arch": "Bogen",
        "window_shape_trapezoid": "Trapez",
        "phone": "Telefon",
        "email": "E-Mail",
        "website": "Webseite",
        "notes": "Notizen",
        "transport": "Transport",
        "installation": "Montage",
        "extra_costs": "Zusatzkosten",
        "vat": "MwSt",
        "vat_rate": "MwSt-Satz",
        "item_type_window": "Fenster",
        "item_type_shutter": "Rollladen",
        "item_type_door": "Innentür",
        "item_type_text": "Text",
        "door_color": "Türfarbe",
        "drive_manual": "Manuell",
        "drive_motor": "Motor",
        "branding_footer": "Angebot erstellt mit Winqo — Fensterangebote in wenigen Minuten.",
        "pdf_generated_with": "Angebot erzeugt mit Winqo",
        "page_label": "Seite",
    },
    "it": {
        "quote": "Preventivo",
        "quote_name": "Nome",
        "quote_number": "Numero",
        "company": "Azienda",
        "summary": "Riepilogo",
        "date": "Data",
        "client": "Cliente",
        "items": "Voci",
        "drawing": "Disegno",
        "position": "Pos.",
        "qty": "Quantità",
        "unit": "Prezzo netto",
        "total": "Totale netto",
        "subtotal": "Subtotale",
        "discount": "Sconto",
        "grand_total": "Totale",
        "no_client": "Nessun cliente selezionato",
        "window_type": "Tipo finestra",
        "window_type_1": "Finestra a 1 anta",
        "window_type_2": "Finestra a 2 ante",
        "window_type_3": "Finestra a 3 ante",
        "dimensions": "Dimensioni",
        "hardware": "Ferramenta",
        "opening": "Apertura",
        "glass": "Vetro",
        "system": "Sistema",
        "profile_color": "Colore profilo",
        "thermal_transmittance": "Trasmittanza termica",
        "glass_double": "Doppio vetro",
        "glass_triple": "Triplo vetro",
        "glass_spec": "Specifica",
        "frame_split": "Suddivisione telaio",
        "movable": "Mobile",
        "center_post": "Montante centrale",
        "center_post_fixed": "Fisso",
        "center_post_movable": "Mobile",
        "sash": "Anta",
        "sash_type": "Tipo di anta",
        "handle": "Maniglia",
        "handle_color": "Colore maniglia",
        "handle_side": "Lato maniglia",
        "slide_direction": "Direzione di scorrimento",
        "left": "Sinistra",
        "right": "Destra",
        "control_side": "Lato comando",
        "box_height": "Altezza cassonetto",
        "drive": "Azione",
        "color": "Colore",
        "pane_type_fix": "Fisso (fix)",
        "pane_type_casement": "A battente",
        "pane_type_tilt_turn": "A ribalta e battente",
        "pane_type_tilt": "A ribalta",
        "pane_type_sliding": "Scorrevole",
        "window_shape": "Forma finestra",
        "window_shape_rect": "Rettangolare",
        "window_shape_round": "Rotonda",
        "window_shape_arch": "Ad arco",
        "window_shape_trapezoid": "Trapezio",
        "phone": "Telefono",
        "email": "Email",
        "website": "Sito web",
        "notes": "Note",
        "transport": "Trasporto",
        "installation": "Montaggio",
        "extra_costs": "Costi extra",
        "vat": "IVA",
        "vat_rate": "Aliquota IVA",
        "item_type_window": "Finestra",
        "item_type_shutter": "Tapparella",
        "item_type_door": "Porta interna",
        "item_type_text": "Solo testo",
        "door_color": "Colore porta",
        "drive_manual": "Manuale",
        "drive_motor": "Motore",
        "branding_footer": "Preventivo generato con Winqo — preventivi infissi in pochi minuti.",
        "pdf_generated_with": "Preventivo generato con Winqo",
        "page_label": "Pagina",
    },
    "es": {
        "quote": "Presupuesto",
        "quote_name": "Nombre",
        "quote_number": "Número",
        "company": "Empresa",
        "summary": "Resumen",
        "date": "Fecha",
        "client": "Cliente",
        "items": "Ítems",
        "drawing": "Dibujo",
        "position": "Pos.",
        "qty": "Cantidad",
        "unit": "Precio neto",
        "total": "Total neto",
        "subtotal": "Subtotal",
        "discount": "Descuento",
        "grand_total": "Total",
        "no_client": "Sin cliente seleccionado",
        "window_type": "Tipo de ventana",
        "window_type_1": "Ventana de 1 hoja",
        "window_type_2": "Ventana de 2 hojas",
        "window_type_3": "Ventana de 3 hojas",
        "dimensions": "Dimensiones",
        "hardware": "Herraje",
        "opening": "Apertura",
        "glass": "Vidrio",
        "system": "Sistema",
        "profile_color": "Color del perfil",
        "thermal_transmittance": "Transmitancia térmica",
        "glass_double": "Doble acristalamiento",
        "glass_triple": "Triple acristalamiento",
        "glass_spec": "Especificación",
        "frame_split": "División del marco",
        "movable": "Móvil",
        "center_post": "Montante central",
        "center_post_fixed": "Fijo",
        "center_post_movable": "Móvil",
        "sash": "Hoja",
        "sash_type": "Tipo de hoja",
        "handle": "Manija",
        "handle_color": "Color de la manija",
        "handle_side": "Lado de la manija",
        "slide_direction": "Dirección de deslizamiento",
        "left": "Izquierda",
        "right": "Derecha",
        "control_side": "Lado de control",
        "box_height": "Altura del cajón",
        "drive": "Accionamiento",
        "color": "Color",
        "pane_type_fix": "Fija (fix)",
        "pane_type_casement": "Batiente",
        "pane_type_tilt_turn": "Oscilobatiente",
        "pane_type_tilt": "Oscilante",
        "pane_type_sliding": "Corredera",
        "window_shape": "Forma de ventana",
        "window_shape_rect": "Rectangular",
        "window_shape_round": "Redonda",
        "window_shape_arch": "En arco",
        "window_shape_trapezoid": "Trapecio",
        "phone": "Teléfono",
        "email": "Correo",
        "website": "Sitio web",
        "notes": "Notas",
        "transport": "Transporte",
        "installation": "Instalación",
        "extra_costs": "Costes extra",
        "vat": "IVA",
        "vat_rate": "Tipo de IVA",
        "item_type_window": "Ventana",
        "item_type_shutter": "Persiana",
        "item_type_door": "Puerta interior",
        "item_type_text": "Texto",
        "door_color": "Color de la puerta",
        "drive_manual": "Manual",
        "drive_motor": "Motor",
        "branding_footer": "Presupuesto generado con Winqo — presupuestos de ventanas en minutos.",
        "pdf_generated_with": "Presupuesto generado con Winqo",
        "page_label": "Página",
    },
}


def make_translator(lang: str):
    normalized = (lang or "en").lower()
    if normalized in ("en-us", "en-uk"):
        normalized = "en"
    def t(key: str) -> str:
        return TRANSLATIONS.get(normalized, TRANSLATIONS["en"]).get(key, TRANSLATIONS["en"].get(key, key))
    return t

def translate_value(value: str, lang: str, mapping: dict[str, dict[str, str]]) -> str:
    if not value:
        return value
    normalized = (lang or "en").lower()
    if normalized in ("en-us", "en-uk"):
        normalized = "en"
    raw = value.split(" - ")[0].strip()
    entry = mapping.get(raw.lower())
    if not entry:
        return raw
    return entry.get(normalized, raw)

def translate_color(value: str, lang: str) -> str:
    return translate_value(value, lang, COLOR_TRANSLATIONS)

def translate_glass(value: str, lang: str) -> str:
    return translate_value(value, lang, GLASS_TRANSLATIONS)


def format_window_spec(spec: dict | None, t, lang: str) -> list[str]:
    if not spec:
        return []
    lines: list[str] = []
    kind = spec.get("kind", "window")

    width = spec.get("width")
    height = spec.get("height")

    if kind == "text":
        return [t("item_type_text")]

    if kind == "shutter":
        if width or height:
            lines.append(f"{t('dimensions')}: {width}×{height} mm")
        if spec.get("box_height"):
            lines.append(f"{t('box_height')}: {spec.get('box_height')} mm")
        control_side = spec.get("control_side")
        if control_side:
            control_label = t("left") if control_side == "lewe" else t("right") if control_side == "prawe" else control_side
            lines.append(f"{t('control_side')}: {control_label}")
        if spec.get("drive"):
            drive_val = spec.get("drive")
            drive_label = t("drive_manual") if drive_val == "manual" else t("drive_motor") if drive_val == "motor" else drive_val
            lines.append(f"{t('drive')}: {drive_label}")
        if spec.get("color_text"):
            lines.append(f"{t('color')}: {translate_color(spec.get('color_text'), lang)}")
        return lines

    if kind == "door":
        if width or height:
            lines.append(f"{t('dimensions')}: {width}×{height} mm")
        opening_side = spec.get("opening_side")
        if opening_side:
            opening_label = t("left") if opening_side == "lewe" else t("right") if opening_side == "prawe" else opening_side
            lines.append(f"{t('opening')}: {opening_label}")
        if spec.get("door_color"):
            lines.append(f"{t('door_color')}: {translate_color(spec.get('door_color'), lang)}")
        if spec.get("handle_color"):
            lines.append(f"{t('handle_color')}: {translate_color(spec.get('handle_color'), lang)}")
        return lines

    if kind == "okiennica":
        if width or height:
            lines.append(f"{t('dimensions')}: {width}×{height} mm")
        if spec.get("profile_color"):
            lines.append(f"{t('profile_color')}: {translate_color(spec.get('profile_color'), lang)}")
        lamella_type = spec.get("lamella_type")
        if lamella_type:
            lamella_label = t("okiennica_lamella_fixed") if lamella_type == "stale" else t("okiennica_lamella_movable") if lamella_type == "ruchome" else lamella_type
            lines.append(f"{t('okiennica_lamella_type')}: {lamella_label}")
        if spec.get("handle_color"):
            lines.append(f"{t('handle_color')}: {translate_color(spec.get('handle_color'), lang)}")
        bars = spec.get("horizontal_bars") or []
        if bars:
            lines.append(f"{t('okiennica_horizontal_bars')}: {len(bars)}")
        return lines

    # window (default)
    if width or height:
        lines.append(f"{t('dimensions')}: {width}×{height} mm")
    shape = spec.get("shape")
    if shape and shape != "rect":
        shape_label = {
            "round": t("window_shape_round"),
            "arch": t("window_shape_arch"),
            "trapezoid": t("window_shape_trapezoid"),
        }.get(shape, shape)
        lines.append(f"{t('window_shape')}: {shape_label}")

    if spec.get("system"):
        lines.append(f"{t('system')}: {spec.get('system')}")
    if spec.get("glass"):
        lines.append(f"{t('glass')}: {translate_glass(spec.get('glass'), lang)}")
    if spec.get("profileColor"):
        lines.append(f"{t('profile_color')}: {translate_color(spec.get('profileColor'), lang)}")
    if spec.get("thermalTransmittance"):
        lines.append(f"{t('thermal_transmittance')}: {spec.get('thermalTransmittance')} Uw")
    if spec.get("hardware"):
        lines.append(f"{t('hardware')}: {spec.get('hardware')}")

    frame_bars = spec.get("frameBars", {}) or {}
    vertical_per_row = frame_bars.get("verticalPerRow") or []
    horiz = frame_bars.get("horizontal") or []
    rows = len(horiz) + 1
    cols_first_row = (vertical_per_row[0] if vertical_per_row else [])
    cols = (len(cols_first_row) + 1) if vertical_per_row else (len(frame_bars.get("vertical", [])) + 1)
    if cols and rows and (cols > 1 or rows > 1):
        lines.append(f"{t('frame_split')}: {cols}×{rows}")

    movable = frame_bars.get("movable") or []
    if movable:
        lines.append(f"{t('movable')}: {len(movable)}")

    panes = spec.get("panes") or []
    for idx, pane in enumerate(panes, start=1):
        ptype = pane.get("type")
        ptype_label = {
            "fix": t("pane_type_fix"),
            "rozwierne": t("pane_type_casement"),
            "rozwierno-uchylne": t("pane_type_tilt_turn"),
            "uchylne": t("pane_type_tilt"),
            "przesuwne": t("pane_type_sliding"),
        }.get(ptype, ptype)

        entry = f"{t('sash')} {idx}: {ptype_label}"
        if ptype == "przesuwne" and pane.get("slideDirection"):
            dir_val = pane.get("slideDirection")
            dir_label = t("right") if dir_val == "prawe" else t("left") if dir_val == "lewe" else dir_val
            entry += f", {t('slide_direction')}: {dir_label}"
        elif pane.get("handleSide"):
            handle_side = pane.get("handleSide")
            handle_label = t("left") if handle_side == "lewe" else t("right") if handle_side == "prawe" else handle_side
            entry += f", {t('handle_side')}: {handle_label}"
        handle_color = pane.get("handleColor") or pane.get("handle_color")
        if handle_color:
            entry += f", {t('handle_color')}: {translate_color(handle_color, lang)}"
        lines.append(entry)

    sash_bars = spec.get("sashBars", {}) or {}
    for pane_idx, bars in sash_bars.items():
        if isinstance(bars, dict):
            vert = bars.get("vertical", []) or []
            horiz_bars = bars.get("horizontal", []) or []
            if vert or horiz_bars:
                lines.append(f"{t('sash')} {int(pane_idx) + 1}: {len(vert)}V + {len(horiz_bars)}H")

    return lines

def resolve_template_name(variant: str | None) -> str:
    if not variant:
        return TEMPLATE_VARIANTS["classic"]
    key = variant.lower()
    if key not in TEMPLATE_VARIANTS:
        raise ValueError(f"Unknown template variant: {variant}")
    return TEMPLATE_VARIANTS[key]


def render_quote_pdf(context: dict, variant: str | None = None) -> bytes:
    template_name = resolve_template_name(variant)
    template = env.get_template(template_name)
    html = template.render(**context, money=money)
    return HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()
