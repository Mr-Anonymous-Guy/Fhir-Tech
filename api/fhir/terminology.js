// ===========================================
// NAMASTE-SYNC FHIR Terminology API (Vercel Serverless)
// ===========================================

// Sample NAMASTE to ICD-11 mappings (in production, use database)
const fhirData = {
  "resourceType": "Bundle",
  "id": "namaste-icd11-mappings",
  "type": "collection",
  "total": 10,
  "entry": [
    {
      "resource": {
        "resourceType": "ConceptMap",
        "id": "namaste-ayurveda-to-icd11",
        "status": "active",
        "sourceUri": "http://who.int/icd11",
        "targetUri": "http://ayush.gov.in/namaste",
        "group": [
          {
            "element": [
              {
                "code": "Jwara",
                "display": "Fever (Ayurvedic)",
                "target": [
                  {
                    "code": "9B00.0",
                    "display": "Fever, unspecified",
                    "equivalence": "equivalent"
                  }
                ]
              },
              {
                "code": "Kasa",
                "display": "Cough (Ayurvedic)",
                "target": [
                  {
                    "code": "CR01.0",
                    "display": "Acute cough",
                    "equivalence": "equivalent"
                  }
                ]
              },
              {
                "code": "Shvasa",
                "display": "Breathlessness (Ayurvedic)",
                "target": [
                  {
                    "code": "CA08.Z",
                    "display": "Unspecified dyspnea",
                    "equivalence": "equivalent"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "ValueSet",
        "id": "namaste-ayurveda-conditions",
        "status": "active",
        "compose": {
          "include": [
            {
              "system": "http://ayush.gov.in/namaste",
              "concept": [
                {
                  "code": "Jwara",
                  "display": "Fever"
                },
                {
                  "code": "Kasa",
                  "display": "Cough"
                },
                {
                  "code": "Shvasa",
                  "display": "Breathlessness"
                },
                {
                  "code": "Aruchi",
                  "display": "Anorexia"
                },
                {
                  "code": "Amlapitta",
                  "display": "Hyperacidity"
                }
              ]
            }
          ]
        }
      }
    ]
  }
};

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { search, system, code } = req.query;

    // Filter based on query parameters
    let filteredData = { ...fhirData };

    if (search) {
      // Simple search implementation
      const searchTerm = search.toLowerCase();
      filteredData.entry = fhirData.entry.filter(entry => {
        const resource = entry.resource;
        if (resource.resourceType === 'ConceptMap') {
          return resource.group?.some(group =>
            group.element?.some(element =>
              element.code?.toLowerCase().includes(searchTerm) ||
              element.display?.toLowerCase().includes(searchTerm)
            )
          );
        } else if (resource.resourceType === 'ValueSet') {
          return resource.compose?.include?.some(include =>
            include.concept?.some(concept =>
              concept.code?.toLowerCase().includes(searchTerm) ||
              concept.display?.toLowerCase().includes(searchTerm)
            )
          );
        }
        return false;
      });
    }

    // Add metadata
    const response = {
      ...filteredData,
      meta: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0",
        count: filteredData.entry.length,
        search: {
          query: search || null,
          system: system || null,
          code: code || null
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('FHIR API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch FHIR terminology data'
    });
  }
}