VOICE='af_heart'
SPEED=1.0
LEAD_IN=.25
TAIL=1.7
BEATS=[
 {'id':'hook','title':'Spot the hole','takes':[("At thirty-five thousand feet, why put a hole in a pressurised window?",.45)]},
 {'id':'layers','title':'Three layers','takes':[("In this Airbus design, look through the scratch pane you can touch.",.25),("Behind it, the inner structural pane has the tiny vent. Then comes the outer structural pane.",1.5)]},
 {'id':'pressure','title':'Follow the pressure','takes':[("The vent lets cabin air into the gap between the structural panes. It is not a hole to the outside.",.35),("That puts cabin pressure on both sides of the inner pane. The outer pane normally carries the pressure difference.",.5)]},
 {'id':'backup','title':'A reserve layer','takes':[("If the outer pane fails, the inner structural pane can take the pressure load.",.25),("The scratch pane protects against passenger contact. Three layers. Different jobs.",.3)]}
]
HIGHLIGHT={'hole':'k','vent':'k','air':'k','gap':'k','pressure':'n','outer':'m','inner':'m','fails':'w','three':'n'}
DIRECTIONS={'hook':'Curious, relaxed passenger question.','layers':'Clearly separate the three names.','pressure':'Calm explanation; stress gap and outer.','backup':'Conditional, without alarm; finish warmly.'}
PRONUNCIATION=[]
ACCURACY_NOTES=['Airbus Safety First: normal outer-pane load and inner-pane backup; AAIB printed page 5: inner vent, gap pressure and nonstructural scratch pane.','Thirty-five thousand feet is an illustrative cruise setting, not a failure threshold.']
