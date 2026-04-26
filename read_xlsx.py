import zipfile
import xml.etree.ElementTree as ET
import sys

def read_xlsx(path):
    try:
        with zipfile.ZipFile(path, 'r') as z:
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
                  'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
            
            # Get sheet names and their relationship IDs
            wb_xml = z.read('xl/workbook.xml')
            wb_tree = ET.fromstring(wb_xml)
            sheets = []
            for s in wb_tree.findall('.//ns:sheet', ns):
                sheets.append({
                    'name': s.get('name'),
                    'id': s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                })
            
            # Get relationship mappings to find sheet filenames
            rels_xml = z.read('xl/_rels/workbook.xml.rels')
            rels_tree = ET.fromstring(rels_xml)
            rels = {}
            for rel in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                rels[rel.get('Id')] = rel.get('Target')
            
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                ss_xml = z.read('xl/sharedStrings.xml')
                ss_tree = ET.fromstring(ss_xml)
                shared_strings = [t.text for t in ss_tree.findall('.//ns:t', ns)]
            
            for sheet_info in sheets:
                sheet_name = sheet_info['name']
                rel_id = sheet_info['id']
                target = rels[rel_id]
                # Fix path if it's relative
                if not target.startswith('xl/'):
                    sheet_path = f"xl/{target}"
                else:
                    sheet_path = target
                
                print(f"\n--- Sheet: {sheet_name} ---")
                
                try:
                    sheet_xml = z.read(sheet_path)
                    sheet_tree = ET.fromstring(sheet_xml)
                    
                    rows = sheet_tree.findall('.//ns:row', ns)
                    for row in rows[:5]: 
                        row_data = []
                        for c in row.findall('ns:c', ns):
                            v = c.find('ns:v', ns)
                            f = c.find('ns:f', ns)
                            
                            val = ""
                            if v is not None:
                                val = v.text
                                if c.get('t') == 's':
                                    val = shared_strings[int(val)]
                            
                            formula = ""
                            if f is not None:
                                formula = f.text
                            
                            cell_ref = c.get('r')
                            if formula:
                                row_data.append(f"{cell_ref}:{val}(f={formula})")
                            else:
                                row_data.append(f"{cell_ref}:{val}")
                        
                        print("\t".join(row_data))
                except Exception as e:
                    print(f"Error reading sheet {sheet_name}: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_xlsx(sys.argv[1])
