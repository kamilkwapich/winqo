
import xml.etree.ElementTree as ET

xml_text = """
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <checkVatResponse xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
            <countryCode>PL</countryCode>
            <vatNumber>8512999497</vatNumber>
            <requestDate>2023-10-26+02:00</requestDate>
            <valid>true</valid>
            <name>CD PROJECT S A</name>
            <address>UL. JAGIELLOŃSKA 74
03-301 WARSZAWA</address>
        </checkVatResponse>
    </soap:Body>
</soap:Envelope>
"""

root = ET.fromstring(xml_text)
# The logic from billing.py
try:
    body_el = root.find(".//{urn:ec.europa.eu:taxud:vies:services:checkVat:types}checkVatResponse")
    print(f"body_el found: {body_el is not None}")
    
    if body_el is None:
        valid_el = root.find('.//valid')
    else:
        valid_el = body_el.find("{urn:ec.europa.eu:taxud:vies:services:checkVat:types}valid")
        
    valid = (valid_el.text.lower() == "true") if valid_el is not None and valid_el.text else False
    
    name_el = root.find('.//name') # This is the line in billing.py
    addr_el = root.find('.//address') # This is the line in billing.py
    
    name = name_el.text.strip() if name_el is not None and name_el.text else None
    address = addr_el.text.strip() if addr_el is not None and addr_el.text else None
    
    print(f"Valid: {valid}")
    print(f"Name: {name}")
    print(f"Address: {address}")
    
    # Check if we can find name with namespace
    ns = "{urn:ec.europa.eu:taxud:vies:services:checkVat:types}"
    name_el_ns = root.find(f".//{ns}name")
    print(f"Name with NS: {name_el_ns.text if name_el_ns is not None else 'Not Found'}")
    
except Exception as e:
    print(f"Exception: {e}")
