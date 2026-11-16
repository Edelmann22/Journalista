/**
 * Data · player database
 * ======================
 *
 * A list of men's national-team footballers, grouped by country, that
 * js/data/questions-players.js turns into prompts: by country, by position,
 * by region and by the first letter of the surname.
 *
 * One player per line:   fame era position Name|extra|aliases
 *
 *   fame      1-4, used as the answer tier: 1 household name ... 4 deep cut
 *   era       n = at their peak since 2010 · o = before 2010 · b = both
 *   position  G goalkeeper · D defender · M midfielder · F forward
 *   Name      as it appears on the answer chip. Accents are fine: matching
 *             ignores them, and the surname alone counts automatically.
 *             Start the name with = for players known by their full name
 *             (Roberto Carlos, Son Heung-min): no automatic surname alias,
 *             and the whole name sorts under its first letter.
 *   aliases   optional nicknames and spellings, separated by |
 *
 * Each player belongs to one country (the national team they played for).
 * Adding players only adds answers; prompts never move (see the generator).
 */

const NATIONS = [
  {
    code: "ESP",
    adj: "Spanish",
    country: "Spain",
    region: "UEFA",
    rows: `
1 b M Andrés Iniesta
1 b M Xavi|xavi hernandez
1 b G Iker Casillas
1 b D Sergio Ramos
1 b D Gerard Piqué
1 b D Carles Puyol
1 b F Fernando Torres|el nino
1 b F David Villa
1 o F Raúl|raul gonzalez
1 n M Rodri|rodrigo hernandez
1 n F Lamine Yamal|lamine|yamal
1 n M Pedri
1 b M Sergio Busquets
1 b M Xabi Alonso|xabi
2 n M Gavi
2 b M Cesc Fàbregas|cesc
2 b M David Silva
2 n M Isco
2 n M Koke
2 n F Álvaro Morata
2 n M Dani Olmo
2 n F Nico Williams|nico
2 n D Dani Carvajal
2 b D Jordi Alba
2 n D César Azpilicueta|azpi
2 n G David de Gea
2 n G Unai Simón
2 b F Pedro|pedro rodriguez
2 b M Juan Mata
2 b M Santi Cazorla
2 o D Fernando Hierro
2 o F Emilio Butragueño|el buitre
2 o M Pep Guardiola|pep
2 o F Fernando Morientes
2 o M Luis Enrique|lucho
2 b F Joaquín|joaquin sanchez
2 b G Víctor Valdés
2 b G Pepe Reina
2 n F Diego Costa
2 n M Thiago Alcântara|thiago
2 n F Mikel Oyarzabal
2 n F Ferran Torres|ferran
2 n D Pau Cubarsí
2 n D Aymeric Laporte
2 n D Marc Cucurella
2 n G Kepa Arrizabalaga|kepa
3 o M Gaizka Mendieta
3 o D Míchel Salgado
3 o G Andoni Zubizarreta
3 o G Santiago Cañizares
3 o M Míchel
3 o D Carlos Marchena
3 o M Marcos Senna
3 o M Rubén Baraja
3 o M David Albelda
3 o F Luis García
3 o M Paco Gento|francisco gento
3 o G Ricardo Zamora
3 b D Joan Capdevila
3 b D Raúl Albiol
3 b D Álvaro Arbeloa
3 n D Jesús Navas
3 n F Aritz Aduriz
3 n F Iago Aspas
3 n M Marcos Llorente
3 n M Fabián Ruiz|fabian
3 n M Mikel Merino
3 n M Martín Zubimendi
3 n D Pau Torres
3 n D Alejandro Grimaldo
3 n F Álvaro Negredo
3 n F Roberto Soldado
3 n F Rodrigo Moreno
3 n F Gerard Moreno
3 n M Saúl Ñíguez|saul
3 n M Ander Herrera
3 n M Dani Ceballos
3 n D Nacho|nacho fernandez
3 n D Juanfran
3 n M Álex Baena
3 n F Yeremy Pino
3 n D Robin Le Normand
3 n F Joselu
3 n M Fermín López
3 n M Sergi Roberto
3 n G David Raya
4 o F Telmo Zarra
4 o F Amancio
4 o F Quini
4 o D Miguel Ángel Nadal
4 o M José Mari Bakero
4 o F Raúl Tamudo
4 o F Diego Tristán
4 o M Vicente Rodríguez|vicente
4 o F Dani Güiza
4 o F Julio Salinas
4 o F Kiko
4 o G José Ángel Iribar|iribar
4 o G Luis Arconada
4 o M Joseba Etxeberria
4 o M Luis Suárez Miramontes|miramontes
4 o F Albert Luque
4 n D Iñigo Martínez
4 n D Dani Vivian
4 n M Óliver Torres
4 n F Borja Iglesias
4 n M Asier Illarramendi
4 n M Bruno Soriano
4 n F Jesé
`,
  },
  {
    code: "FRA",
    adj: "French",
    country: "France",
    region: "UEFA",
    rows: `
1 o M Zinedine Zidane|zizou
1 o F Thierry Henry
1 o M Michel Platini
1 n F Kylian Mbappé
1 b F Karim Benzema
1 n F Antoine Griezmann
1 n M N'Golo Kanté|ngolo kante
1 n M Paul Pogba
1 b F Franck Ribéry
1 o M Patrick Vieira
1 o D Lilian Thuram
1 o D Marcel Desailly
1 o G Fabien Barthez
1 n G Hugo Lloris
1 n F Ousmane Dembélé
1 b F Olivier Giroud
2 o F David Trezeguet
2 o M Didier Deschamps
2 o M Claude Makélélé
2 o F Jean-Pierre Papin|jpp
2 o F Eric Cantona
2 o D Laurent Blanc
2 o D Bixente Lizarazu
2 o M Robert Pirès
2 o M Youri Djorkaeff
2 o F Nicolas Anelka
2 o F Sylvain Wiltord
2 o M Emmanuel Petit
2 o F David Ginola
2 b D William Gallas
2 b D Éric Abidal
2 b M Florent Malouda
2 b D Patrice Evra
2 b M Samir Nasri
2 b D Bacary Sagna
2 n D Raphaël Varane
2 n D Benjamin Pavard
2 n D Lucas Hernández
2 n D Theo Hernández
2 n D Jules Koundé
2 n D William Saliba
2 n D Dayot Upamecano
2 n D Ibrahima Konaté
2 n D Laurent Koscielny
2 n M Blaise Matuidi
2 n M Aurélien Tchouaméni
2 n M Eduardo Camavinga
2 n M Adrien Rabiot
2 n F Kingsley Coman
2 n F Marcus Thuram
2 n F Alexandre Lacazette
2 n F Anthony Martial
2 n M Dimitri Payet
2 n F Christopher Nkunku
2 n F Michael Olise
2 n F Désiré Doué
2 n G Mike Maignan
2 o F Just Fontaine
2 o M Raymond Kopa
3 o M Christian Karembeu
3 o D Frank Leboeuf
3 o D Mikaël Silvestre
3 o F Djibril Cissé
3 o F Louis Saha
3 o M Jean Tigana
3 o M Alain Giresse
3 o F Christophe Dugarry
3 o D Willy Sagnol
3 b M Yoann Gourcuff
3 n D Presnel Kimpembe
3 n D Samuel Umtiti
3 n D Mamadou Sakho
3 n M Corentin Tolisso
3 n M Moussa Sissoko
3 n M Yohan Cabaye
3 n M Morgan Schneiderlin
3 n F Randal Kolo Muani
3 n M Mathieu Valbuena
3 n F Loïc Rémy
3 n F Kevin Gameiro
3 n F André-Pierre Gignac
3 n F Wissam Ben Yedder
3 n M Warren Zaïre-Emery
3 n F Bradley Barcola
3 n G Steve Mandanda
3 n F Hatem Ben Arfa
3 n D Clément Lenglet
3 n D Lucas Digne
3 n D Benjamin Mendy
3 n M Youssouf Fofana
3 n D Kurt Zouma
3 n F Florian Thauvin
3 n D Ferland Mendy
3 n F Jean-Philippe Mateta
4 o D Maxime Bossis
4 o D Manuel Amoros
4 o F Dominique Rocheteau
4 o M Luis Fernández
4 o F Stéphane Guivarc'h|guivarch
4 o D Jean-Alain Boumsong
4 o M Vikash Dhorasoo
4 o F Sidney Govou
4 o G Grégory Coupet
4 o G Bernard Lama
4 o D Basile Boli
4 n M Tanguy Ndombele
4 n D Benoît Trémoulinas
`,
  },
  {
    code: "GER",
    adj: "German",
    country: "Germany",
    region: "UEFA",
    rows: `
1 o F Gerd Müller|gerd mueller
1 o D Franz Beckenbauer|kaiser franz|der kaiser
1 o M Lothar Matthäus|matthaeus
1 o F Jürgen Klinsmann
1 b F Miroslav Klose
1 o G Oliver Kahn
1 b M Michael Ballack
1 n G Manuel Neuer
1 n F Thomas Müller|thomas mueller
1 n M Toni Kroos
1 b M Bastian Schweinsteiger|schweini
1 b D Philipp Lahm
1 n M Mesut Özil|oezil
1 n M Jamal Musiala
1 n M Florian Wirtz
1 n M Joshua Kimmich
2 o F Karl-Heinz Rummenigge|kalle rummenigge
2 o F Rudi Völler|voeller
2 o D Andreas Brehme
2 o D Jürgen Kohler
2 o D Matthias Sammer
2 o F Oliver Bierhoff
2 o M Andreas Möller|moeller
2 o M Thomas Hässler|haessler
2 o M Bernd Schuster
2 o G Sepp Maier
2 o G Jens Lehmann
2 o F Uwe Seeler
2 o M Günter Netzer
2 o D Berti Vogts
2 o D Paul Breitner
2 o M Stefan Effenberg
2 b D Per Mertesacker
2 b F Lukas Podolski|poldi
2 b F Mario Gómez
2 n D Mats Hummels
2 n D Jérôme Boateng
2 n D Antonio Rüdiger|ruediger
2 n M Sami Khedira
2 n M İlkay Gündoğan|gundogan|guendogan
2 n F Marco Reus
2 n M Mario Götze|goetze
2 n M Leon Goretzka
2 n F Kai Havertz
2 n F Leroy Sané
2 n F Serge Gnabry
2 n F André Schürrle|schuerrle
2 n F Timo Werner
2 n G Marc-André ter Stegen|ter stegen
3 o M Wolfgang Overath
3 o F Helmut Rahn
3 o M Fritz Walter
3 o F Uli Hoeneß|hoeness
3 o G Toni Schumacher|harald schumacher
3 o M Dietmar Hamann|didi hamann
3 o M Mehmet Scholl
3 o F Karl-Heinz Riedle
3 o D Christian Ziege
3 o M Bernd Schneider
3 o M Sebastian Deisler
3 o F Oliver Neuville
3 b M Torsten Frings
3 b F Kevin Kurányi
3 n D Niklas Süle|suele
3 n D Jonathan Tah
3 n D Benedikt Höwedes|hoewedes
3 n D Shkodran Mustafi
3 n D Robin Gosens
3 n D David Raum
3 n M Julian Draxler
3 n F Niclas Füllkrug|fuellkrug
3 n M Julian Brandt
3 n M Christoph Kramer
3 n M Emre Can
3 n G Bernd Leno
3 n G Kevin Trapp
3 n G Roman Weidenfeller
3 n F Karim Adeyemi
4 o F Klaus Fischer
4 o F Horst Hrubesch
4 o G Bodo Illgner
4 o D Guido Buchwald
4 o F Carsten Jancker
4 o D Christian Wörns|woerns
4 o F Ulf Kirsten
4 o F Fredi Bobic
4 o D Thomas Helmer
4 o D Stefan Reuter
4 o M Jens Jeremies
4 b D Arne Friedrich
4 n D Marcel Schmelzer
4 n D Matthias Ginter
4 n F Kevin Volland
4 n M Robert Andrich
4 n M Pascal Groß|gross
4 n F Max Kruse
4 n F Deniz Undav
4 n M Aleksandar Pavlović
`,
  },
  {
    code: "ITA",
    adj: "Italian",
    country: "Italy",
    region: "UEFA",
    rows: `
1 b M Andrea Pirlo
1 o D Paolo Maldini
1 o D Franco Baresi
1 o D Fabio Cannavaro
1 o F Roberto Baggio
1 b F Alessandro Del Piero
1 b F Francesco Totti
1 b G Gianluigi Buffon|gigi buffon
1 o F Paolo Rossi
1 o F Filippo Inzaghi|pippo inzaghi|superpippo
1 o F Christian Vieri|bobo vieri
1 n G Gianluigi Donnarumma|gigio
1 b D Giorgio Chiellini
1 n D Leonardo Bonucci
1 n F Mario Balotelli
2 o D Alessandro Nesta
2 o M Gennaro Gattuso|rino gattuso
2 o D Gianluca Zambrotta
2 b M Daniele De Rossi
2 o F Luca Toni
2 o F Alberto Gilardino
2 b D Marco Materazzi
2 o G Dino Zoff
2 o F Gianluca Vialli
2 o F Roberto Mancini
2 o F Gianfranco Zola
2 o D Fabio Grosso
2 b F Antonio Cassano
2 n F Ciro Immobile
2 n F Lorenzo Insigne
2 n F Federico Chiesa
2 n M Marco Verratti
2 n M Jorginho
2 n M Nicolò Barella
2 n M Sandro Tonali
2 n M Claudio Marchisio
2 n D Andrea Barzagli
2 n D Alessandro Bastoni
3 o F Giuseppe Meazza
3 o F Gigi Riva|luigi riva
3 o M Gianni Rivera
3 o M Sandro Mazzola
3 o D Giacinto Facchetti
3 o G Walter Zenga
3 o D Claudio Gentile
3 o D Gaetano Scirea
3 o M Marco Tardelli
3 o F Salvatore Schillaci|toto schillaci
3 o F Fabrizio Ravanelli
3 o M Demetrio Albertini
3 o M Roberto Donadoni
3 o D Giuseppe Bergomi
3 o D Alessandro Costacurta|billy costacurta
3 o D Ciro Ferrara
3 o G Angelo Peruzzi
3 o G Francesco Toldo
3 o G Gianluca Pagliuca
3 o M Mauro Camoranesi
3 o F Giuseppe Signori
3 b F Antonio Di Natale
3 n F Federico Bernardeschi
3 n F Graziano Pellè
3 n F Andrea Belotti
3 n F Gianluca Scamacca
3 n F Mateo Retegui
3 n F Giacomo Raspadori
3 n F Moise Kean
3 n F Stephan El Shaarawy
3 n F Domenico Berardi
3 n F Sebastian Giovinco
3 n M Riccardo Montolivo
3 n M Antonio Candreva
3 n M Davide Frattesi
3 n M Lorenzo Pellegrini
3 n D Alessandro Florenzi
3 n D Leonardo Spinazzola
3 n D Giovanni Di Lorenzo
3 n D Riccardo Calafiori
3 n D Federico Dimarco
3 n D Francesco Acerbi
3 n D Matteo Darmian
3 n D Davide Astori
3 n G Guglielmo Vicario
4 o F Silvio Piola
4 o F Pierluigi Casiraghi
4 o M Simone Perrotta
4 o F Vincenzo Iaquinta
4 b G Christian Abbiati
4 b G Morgan De Sanctis
4 n M Emanuele Giaccherini
4 n M Bryan Cristante
4 n G Salvatore Sirigu
4 n G Federico Marchetti
4 n G Alex Meret
4 n G Mattia Perin
`,
  },
  {
    code: "ENG",
    adj: "English",
    country: "England",
    region: "UEFA",
    rows: `
1 b F Wayne Rooney
1 n F Harry Kane
1 o F Alan Shearer
1 b M Steven Gerrard
1 b M Frank Lampard
1 o M David Beckham
1 b M Paul Scholes
1 o F Gary Lineker
1 o M Bobby Charlton|sir bobby charlton
1 o F Michael Owen
1 n M Jude Bellingham
1 n F Bukayo Saka
1 n M Phil Foden
1 n F Raheem Sterling
1 b D John Terry
1 b D Rio Ferdinand
1 n D Trent Alexander-Arnold|trent|taa
1 n M Declan Rice
1 n M Cole Palmer
1 n F Marcus Rashford
2 o D Bobby Moore
2 o F Jimmy Greaves
2 o G Gordon Banks
2 o G Peter Shilton
2 o G David Seaman
2 o M Paul Gascoigne|gazza
2 o D Tony Adams
2 o D Stuart Pearce
2 o F Kevin Keegan
2 o M Bryan Robson
2 o F Geoff Hurst
2 o M Glenn Hoddle
2 o F Teddy Sheringham
2 o F Robbie Fowler
2 o F Andy Cole|andrew cole
2 o F Ian Wright
2 o D Sol Campbell
2 o D Gary Neville
2 o D Gareth Southgate
2 b D Jamie Carragher
2 b D Ashley Cole
2 b F Peter Crouch
2 b F Jermain Defoe
2 b M Michael Carrick
2 b M James Milner
2 b F Theo Walcott
2 n D Kyle Walker
2 n D John Stones
2 n D Harry Maguire
2 n D Luke Shaw
2 n D Kieran Trippier
2 n D Gary Cahill
2 n D Reece James
2 n G Jordan Pickford
2 n G Joe Hart
2 n M Jordan Henderson
2 n M Mason Mount
2 n M Jack Grealish
2 n M Dele Alli|dele
2 n F Jamie Vardy
2 n F Daniel Sturridge
2 n F Jadon Sancho
2 n F Ollie Watkins
3 o M Stanley Matthews|sir stanley matthews
3 o M Tom Finney
3 o D Jack Charlton
3 o D Terry Butcher
3 o F Trevor Francis
3 o M Ray Wilkins
3 o M Chris Waddle
3 o F Peter Beardsley
3 o F Les Ferdinand
3 o F Emile Heskey
3 o M Steve McManaman|macca
3 o M David Platt
3 o M Paul Ince
3 o D Martin Keown
3 o M Nicky Butt
3 b M Joe Cole
3 b G Paul Robinson
3 b G David James
3 b M Owen Hargreaves
3 b M Gareth Barry
3 b F Darren Bent
3 b G Robert Green
3 n D Phil Jagielka
3 n D Chris Smalling
3 n D Leighton Baines
3 n D Marc Guéhi|guehi
3 n D Ben White
3 n G Aaron Ramsdale
3 n G Nick Pope
3 n G Ben Foster
3 n M Kalvin Phillips
3 n M Jack Wilshere
3 n M Eric Dier
3 n M Ross Barkley
3 n M Adam Lallana
3 n M Alex Oxlade-Chamberlain|oxlade chamberlain|the ox
3 n M Kobbie Mainoo
3 n M Conor Gallagher
3 n M Eberechi Eze
3 n F Danny Welbeck
3 n F Ivan Toney
3 n F Callum Wilson
3 n F Dominic Calvert-Lewin|calvert lewin
3 n F Tammy Abraham
3 n F Anthony Gordon
3 n F Jarrod Bowen
3 n F Andy Carroll
4 o F Dixie Dean
4 o F Nat Lofthouse
4 o M Martin Peters
4 o F Roger Hunt
4 o G Ray Clemence
4 o D Des Walker
4 o M Darren Anderton
4 o M Kieron Dyer
4 o G Tim Flowers
4 o G Nigel Martyn
4 o G Chris Woods
4 n D Ezri Konsa
4 n G Dean Henderson
4 n M Morgan Gibbs-White|gibbs white
4 n F Rickie Lambert
`,
  },
  {
    code: "BRA",
    adj: "Brazilian",
    country: "Brazil",
    region: "CONMEBOL",
    rows: `
1 o F Pelé
1 o F Ronaldo|ronaldo nazario|r9|ronaldo fenomeno|il fenomeno
1 o M Ronaldinho|ronaldinho gaucho
1 b M Kaká|ricardo kaka
1 o F Romário
1 o F Rivaldo
1 o D =Roberto Carlos|carlos
1 o D Cafu
1 o M Zico
1 n F Neymar|neymar jr
1 n F =Vinícius Júnior|vinicius|vini jr|vini|vinicius jr
1 o F Garrincha
1 o M Sócrates
1 n D Marcelo
1 n D Thiago Silva
1 n G Alisson|alisson becker
1 n M Casemiro
1 n M Philippe Coutinho|coutinho
1 n F Roberto Firmino|firmino|bobby firmino
1 b D Dani Alves|daniel alves
2 o F Adriano
2 o F Bebeto
2 o M Dunga
2 o D Lúcio
2 o G Cláudio Taffarel|taffarel
2 o G Dida
2 b G =Júlio César|julio cesar
2 n G Ederson
2 o M Juninho Pernambucano|juninho
2 o M Rivellino|rivelino|roberto rivelino
2 o F Jairzinho
2 o D =Carlos Alberto|carlos alberto torres
2 o M Gilberto Silva
2 o M Falcão|paulo roberto falcao
2 b F Robinho
2 b D Maicon
2 b M Fernandinho
2 b D David Luiz
2 n M Oscar
2 n M Willian
2 n M Fabinho
2 n M Lucas Paquetá
2 n M Bruno Guimarães
2 n F Hulk
2 n F Gabriel Jesus
2 n F Richarlison
2 n F Raphinha
2 n F Rodrygo
2 n F Gabriel Martinelli|martinelli
2 n D Marquinhos
2 n D Éder Militão
2 n D Gabriel Magalhães
3 o M Juninho Paulista
3 o M Tostão
3 o M Gérson
3 o F Careca
3 o M Leonardo
3 o F Denílson
3 o M Emerson
3 o D Aldair
3 o F Edmundo
3 o F Giovane Élber|elber
3 o F Vavá
3 o M Didi
3 o D Nílton Santos
3 o M Júnior|leovegildo junior
3 b M =Zé Roberto|ze roberto
3 b M Elano
3 b F =Luís Fabiano|luis fabiano
3 b F Alexandre Pato|pato
3 b M Anderson
3 n M Paulinho
3 n M Fred
3 n M Douglas Costa
3 n F Antony
3 n F Endrick
3 n F Lucas Moura
3 n F Gabriel Barbosa|gabigol
3 n F Savinho
3 n F =João Pedro|joao pedro
3 n F Estêvão
3 n D =Alex Sandro|alex sandro
3 n D Danilo
3 n D =Filipe Luís|filipe luis
3 n D Dante
4 o D Edmílson
4 o D =Roque Júnior|roque junior
4 o D Djalma Santos
4 o F Ademir
4 o F Leônidas
4 o F Arthur Friedenreich|friedenreich
4 o M Toninho Cerezo|cerezo
4 o F Amoroso
4 o F Sonny Anderson
4 o F Grafite
4 o F Nilmar
4 b D Juan|juan silveira
4 n M Arthur|arthur melo
4 n M Allan
4 n M =Renato Augusto|renato augusto
4 n D Miranda
4 n D Bremer
4 n D Alex Telles
`,
  },
  {
    code: "ARG",
    adj: "Argentine",
    country: "Argentina",
    region: "CONMEBOL",
    rows: `
1 n F Lionel Messi|leo messi
1 o M Diego Maradona
1 o F Gabriel Batistuta|batigol
1 o F Alfredo Di Stéfano
1 n F Sergio Agüero|kun aguero|kun
1 n M Ángel Di María
1 b F Carlos Tevez
1 o F Hernán Crespo
1 o M Juan Román Riquelme|roman riquelme
1 n F Julián Álvarez
1 n F Lautaro Martínez|lautaro
1 n G Emiliano Martínez|dibu|dibu martinez|emi martinez
1 b M Javier Mascherano|masche
1 o M Juan Sebastián Verón|seba veron|la brujita
1 n F Gonzalo Higuaín|pipita
1 n F Paulo Dybala
1 o D Javier Zanetti|pupi
1 n M Enzo Fernández|enzo
1 n M Alexis Mac Allister|macallister
2 o F Mario Kempes
2 o M Ariel Ortega
2 o F Claudio Caniggia
2 o M Diego Simeone|cholo simeone
2 o D Roberto Ayala
2 o D Walter Samuel
2 o D Daniel Passarella
2 o M Fernando Redondo
2 o M Pablo Aimar
2 o M Esteban Cambiasso
2 o F Javier Saviola
2 b F Diego Milito
2 o M Osvaldo Ardiles|ossie ardiles
2 b F Ezequiel Lavezzi|pocho
2 n M Rodrigo De Paul
2 n F Alejandro Garnacho|garnacho
2 n D Cristian Romero|cuti romero
2 n D Nicolás Otamendi
2 n D Lisandro Martínez|lisandro
2 n D Pablo Zabaleta
2 n F Mauro Icardi
3 o M Andrés D'Alessandro
3 o F Abel Balbo
3 o D Juan Pablo Sorín
3 o M Matías Almeyda
3 o M Marcelo Gallardo
3 o G Ubaldo Fillol
3 o G Sergio Goycochea
3 o M Jorge Burruchaga
3 o F Omar Sívori
3 o F Martín Palermo
3 o D Oscar Ruggeri
3 b D Gabriel Heinze
3 b M Maxi Rodríguez
3 b D Martín Demichelis
3 b F Rodrigo Palacio
3 b G Sergio Romero|chiquito romero
3 n M Ever Banega
3 n M Lucas Biglia
3 n M Enzo Pérez
3 n M Leandro Paredes
3 n M Giovani Lo Celso
3 n D Nahuel Molina
3 n D Nicolás Tagliafico
3 n D Marcos Acuña
3 n D Gonzalo Montiel
3 n D Marcos Rojo
3 n F Erik Lamela
3 n M Javier Pastore
3 n F Ángel Correa
4 o M Ricardo Bochini
4 o M Guillermo Barros Schelotto
4 b D Nicolás Burdisso
4 b M Lucho González
4 n M Exequiel Palacios
4 n D Germán Pezzella
4 n D Federico Fazio
4 n F Nicolás Gaitán
4 n F Nicolás González
4 n F Giuliano Simeone
4 n M Thiago Almada
4 n G Franco Armani
`,
  },
  {
    code: "NED",
    adj: "Dutch",
    country: "the Netherlands",
    region: "UEFA",
    rows: `
1 o F Johan Cruyff|cruijff
1 o F Marco van Basten
1 o M Ruud Gullit
1 o F Dennis Bergkamp
1 b F Ruud van Nistelrooy|van nistelrooij
1 n F Arjen Robben
1 n F Robin van Persie|rvp
1 b M Wesley Sneijder
1 o M Frank Rijkaard
1 n D Virgil van Dijk
1 o D Jaap Stam
1 o G Edwin van der Sar
1 o M Clarence Seedorf
1 n M Frenkie de Jong
2 o M Edgar Davids
2 o M Johan Neeskens
2 o F Patrick Kluivert
2 o D Ronald Koeman
2 o D Frank de Boer
2 o F Marc Overmars
2 o M Phillip Cocu
2 o F Jimmy Floyd Hasselbaink
2 b M Mark van Bommel
2 b M Rafael van der Vaart
2 b M Nigel de Jong
2 b D Giovanni van Bronckhorst|gio van bronckhorst
2 b F Dirk Kuyt
2 b F Klaas-Jan Huntelaar|huntelaar
2 n M Georginio Wijnaldum|gini wijnaldum
2 n M Xavi Simons
2 n F Memphis Depay|memphis
2 n F Cody Gakpo
2 n D Matthijs de Ligt
2 n D Daley Blind
2 n D Denzel Dumfries
3 o M Ronald de Boer
3 o F Rob Rensenbrink
3 o D Ruud Krol
3 o F Roy Makaay
3 o F Pierre van Hooijdonk
3 b D John Heitinga
3 b G Maarten Stekelenburg
3 b F Ryan Babel
3 n G Jasper Cillessen
3 n M Kevin Strootman
3 n M Donny van de Beek
3 n M Teun Koopmeiners
3 n M Tijjani Reijnders
3 n M Ryan Gravenberch
3 n M Davy Klaassen
3 n F Steven Bergwijn
3 n F Donyell Malen
3 n F Wout Weghorst
3 n F Luuk de Jong
3 n F Justin Kluivert
3 n D Stefan de Vrij
3 n D Nathan Aké
3 n D Jurriën Timber
3 n D Micky van de Ven
3 n D Jeremie Frimpong
4 o M Wim van Hanegem
4 o M Arie Haan
4 o F Johnny Rep
4 o F Faas Wilkes
4 o D Danny Blind
4 b D Khalid Boulahrouz
4 n G Bart Verbruggen
4 n F Bas Dost
4 n F Quincy Promes
4 n M Ibrahim Afellay
4 n F Eljero Elia
4 n D Daryl Janmaat
4 n D Ron Vlaar
4 n D Joël Veltman
`,
  },
  {
    code: "POR",
    adj: "Portuguese",
    country: "Portugal",
    region: "UEFA",
    rows: `
1 n F Cristiano Ronaldo|cr7
1 o M Luís Figo
1 o F Eusébio
1 o M Rui Costa
1 n M Bruno Fernandes
1 o M Deco
1 b D Pepe
1 n M Bernardo Silva
1 n F João Félix|joao felix
1 n F Rafael Leão
1 n D Rúben Dias
2 b D Ricardo Carvalho
2 b G Rui Patrício
2 o F Pauleta
2 o M Simão|simao sabrosa
2 o F Paulo Futre
2 b M Ricardo Quaresma|quaresma
2 b M João Moutinho
2 b F Nani
2 n D João Cancelo
2 n D Nuno Mendes
2 n M Rúben Neves
2 n M Vitinha
2 n M João Neves
2 n F Diogo Jota
2 o G Vítor Baía|vitor baia
3 b D Paulo Ferreira
3 b G Ricardo
3 n G Diogo Costa
3 o M Maniche
3 o M Costinha
3 o F Nuno Gomes
3 o M Paulo Sousa
3 o D Fernando Couto
3 o M João Pinto
3 o D Jorge Costa
3 o F Hélder Postiga
3 b M Raul Meireles
3 b D Bruno Alves
3 b D Fábio Coentrão
3 n D José Fonte
3 n D Raphaël Guerreiro
3 n D Diogo Dalot
3 n D Nélson Semedo
3 n M William Carvalho
3 n M Renato Sanches
3 n M João Palhinha
3 n M André Gomes
3 n F Gonçalo Ramos
3 n F André Silva
3 n F Pedro Neto
3 n F Francisco Conceição
3 n F Éder
4 o F Rui Jordão
4 o M Mário Coluna
4 o D Abel Xavier
4 o M Tiago
4 o M Petit
4 b F Hugo Almeida
4 n D António Silva
4 n D Gonçalo Inácio
4 n M Otávio
4 n M Adrien Silva
4 n F Ricardo Horta
4 n F Gelson Martins
4 n F Rafa Silva
`,
  },
  {
    code: "BEL",
    adj: "Belgian",
    country: "Belgium",
    region: "UEFA",
    rows: `
1 n M Kevin De Bruyne|kdb
1 n F Eden Hazard
1 n F Romelu Lukaku
1 n G Thibaut Courtois
2 n D Vincent Kompany
2 n D Jan Vertonghen
2 n D Toby Alderweireld
2 n M Axel Witsel
2 n M Marouane Fellaini
2 n M Mousa Dembélé
2 n M Youri Tielemans
2 n F Yannick Carrasco|ferreira carrasco
2 n F Leandro Trossard
2 n F Dries Mertens
2 n F Christian Benteke
2 n F Jérémy Doku
3 o M Enzo Scifo
3 o G Jean-Marie Pfaff
3 o G Michel Preud'homme|preudhomme
3 o F Marc Wilmots
3 n D Thomas Vermaelen
3 n D Thomas Meunier
3 n M Nacer Chadli
3 n M Amadou Onana
3 n F Michy Batshuayi
3 n F Divock Origi
3 n F Charles De Ketelaere
3 n F Loïs Openda
3 n F Kevin Mirallas
3 n G Simon Mignolet
4 o F Jan Ceulemans
4 o F Paul Van Himst
4 o F Émile Mpenza
4 o D Eric Gerets
4 o M Franky Van der Elst
4 n D Timothy Castagne
4 n D Jason Denayer
4 n D Arthur Theate
4 n M Steven Defour
`,
  },
  {
    code: "CRO",
    adj: "Croatian",
    country: "Croatia",
    region: "UEFA",
    yugo: true,
    rows: `
1 n M Luka Modrić
1 n M Ivan Rakitić
1 o F Davor Šuker
2 n F Mario Mandžukić
2 n F Ivan Perišić
2 n M Marcelo Brozović
2 n M Mateo Kovačić
2 n D Joško Gvardiol
2 n D Dejan Lovren
2 o M Zvonimir Boban
2 o M Robert Prosinečki
3 n D Domagoj Vida
3 n D Šime Vrsaljko
3 n G Danijel Subašić
3 n G Dominik Livaković
3 b F Ivica Olić
3 n F Andrej Kramarić
3 n F Ante Rebić
3 b D Josip Šimunić
3 o F Alen Bokšić
3 o D Slaven Bilić
3 o M Niko Kovač
3 b M Niko Kranjčar
3 b F Eduardo|eduardo da silva
3 o D Dario Šimić
4 n F Nikola Kalinić
4 n M Mario Pašalić
4 n M Lovro Majer
4 n D Ivan Strinić
4 o D Robert Jarni
4 o D Igor Štimac
4 o G Stipe Pletikosa
`,
  },
  {
    code: "URU",
    adj: "Uruguayan",
    country: "Uruguay",
    region: "CONMEBOL",
    rows: `
1 n F Luis Suárez
1 n F Edinson Cavani
1 o F Diego Forlán
1 n M Federico Valverde|fede valverde
2 n D Diego Godín
2 n D Ronald Araújo
2 n M Rodrigo Bentancur
2 n F Darwin Núñez
2 o M Enzo Francescoli
2 o F Álvaro Recoba|el chino
3 n D José María Giménez
3 n D Martín Cáceres
3 n G Fernando Muslera
3 n M Lucas Torreira
3 n M Manuel Ugarte
3 n M Giorgian de Arrascaeta
3 o D Paolo Montero
3 o F Rubén Sosa
3 o M Gus Poyet
3 o M Obdulio Varela
3 o F Alcides Ghiggia
3 o F Juan Alberto Schiaffino
3 b D Diego Lugano
3 b F Sebastián Abreu|el loco abreu
4 n D Maxi Pereira
4 n F Facundo Pellistri
4 n M Matías Vecino
4 n M Egidio Arévalo Ríos
4 n F Cristhian Stuani
4 n M Álvaro Pereira
4 o F Daniel Fonseca
4 o F Héctor Scarone
`,
  },
  {
    code: "COL",
    adj: "Colombian",
    country: "Colombia",
    region: "CONMEBOL",
    rows: `
1 o M Carlos Valderrama|el pibe
1 n F Radamel Falcao|falcao
1 n M James Rodríguez|james
1 n F Luis Díaz|lucho diaz
2 n F Juan Cuadrado
2 n G David Ospina
2 o G René Higuita|higuita
2 o F Faustino Asprilla|tino asprilla
2 o D Iván Córdoba
3 n D Davinson Sánchez
3 n D Yerry Mina
3 n F Jackson Martínez
3 n F Carlos Bacca
3 n F Duván Zapata
3 n F Luis Muriel
3 n M Jefferson Lerma
3 n M Fredy Guarín
3 n F Jhon Durán
3 o M Freddy Rincón
3 o D Andrés Escobar
3 o D Mario Yepes
4 n M Juan Fernando Quintero
4 n M Abel Aguilar
4 n M Wílmar Barrios
4 n D Daniel Muñoz
4 o F Adolfo Valencia
4 o F Víctor Aristizábal
`,
  },
  {
    code: "MEX",
    adj: "Mexican",
    country: "Mexico",
    region: "CONCACAF",
    rows: `
1 o F Hugo Sánchez
1 b D Rafael Márquez|rafa marquez
1 n F Javier Hernández|chicharito
1 n G Guillermo Ochoa|memo ochoa
2 n F Hirving Lozano|chucky lozano
2 n F Raúl Jiménez
2 n M Andrés Guardado
2 n F Carlos Vela
2 n M Edson Álvarez
2 n F Santiago Giménez
2 o G Jorge Campos
2 o F Cuauhtémoc Blanco
3 n F Giovani dos Santos
3 n M Héctor Herrera
3 n F Jesús Corona|tecatito
3 o F Jared Borgetti
4 n F Diego Lainez
4 n D Miguel Layún
4 n D Héctor Moreno
4 o F Luis Hernández
4 o D Claudio Suárez
4 o D Carlos Salcido
4 o M Pável Pardo
4 o M Ramón Ramírez
`,
  },
  {
    code: "USA",
    adj: "American",
    country: "the USA",
    region: "CONCACAF",
    rows: `
1 n F Christian Pulisic
1 o F Landon Donovan
1 b G Tim Howard
2 b F Clint Dempsey
2 o G Brad Friedel
2 n M Michael Bradley
2 n M Weston McKennie
3 o G Kasey Keller
3 n F Jozy Altidore
3 n M Tyler Adams
3 n M Gio Reyna
3 n D Sergiño Dest
3 n F Timothy Weah
3 n F Folarin Balogun
3 o F Brian McBride
3 o M Claudio Reyna
3 o D Alexi Lalas
3 o M Cobi Jones
3 b M DaMarcus Beasley
3 n G Matt Turner
3 n D Antonee Robinson
4 o F Eric Wynalda
4 b D Carlos Bocanegra
4 n G Brad Guzan
4 n M Yunus Musah
4 n F Ricardo Pepi
4 n D DeAndre Yedlin
4 n M Jermaine Jones
4 n D Tim Ream
`,
  },
  {
    code: "BUL",
    adj: "Bulgarian",
    country: "Bulgaria",
    region: "UEFA",
    rows: `
1 o F Hristo Stoichkov|stoitchkov
1 b F Dimitar Berbatov|berba
2 o M Krasimir Balakov
2 o M Yordan Letchkov|lechkov|iordan letchkov
2 o F Emil Kostadinov
2 o G Borislav Mihaylov|mihailov|mikhailov
2 o D Trifon Ivanov
2 o F Lyuboslav Penev
2 o F Georgi Asparuhov|gundi
2 b F Martin Petrov
2 b M Stiliyan Petrov|stilian petrov
3 o M Hristo Bonev
3 o F Petar Zhekov
3 o D Dimitar Penev
3 o F Nasko Sirakov
3 o M Zlatko Yankov
3 o F Ivaylo Yordanov|ivailo yordanov
3 o D Radostin Kishishev
3 o F Georgi Slavkov
3 b F Valeri Bojinov
3 n M Ivelin Popov
3 n F Kiril Despodov
3 n F Martin Kamburov
4 o M Ilian Iliev
4 o D Petar Hubchev
4 o D Tsanko Tsvetanov
4 o M Daniel Borimirov
4 o M Georgi Peev
4 o F Dimitar Yakimov
4 b G Dimitar Ivankov
4 b G Stoyan Kolev
4 n D Nikolay Bodurov
4 n M Georgi Milanov
4 n F Aleksandar Tonev
4 n M Svetoslav Dyakov
4 n G Nikolay Mihaylov
4 n F Andrey Galabinov
4 n M Ilia Gruev
`,
  },
  {
    code: "SRB",
    adj: "Serbian or Yugoslav",
    country: "Serbia or Yugoslavia",
    region: "UEFA",
    yugo: true,
    rows: `
1 b D Nemanja Vidić
2 b M Dejan Stanković|deki
2 n D Branislav Ivanović
2 n D Aleksandar Kolarov
2 n M Nemanja Matić
2 n M Dušan Tadić
2 n F Aleksandar Mitrović
2 n F Dušan Vlahović
2 n M Sergej Milinković-Savić|milinkovic savic
2 o M Dragan Stojković|piksi
2 o F Predrag Mijatović
2 o D Siniša Mihajlović
2 o M Dejan Savićević
3 n F Luka Jović
3 n M Filip Kostić
3 b F Nikola Žigić
3 o F Mateja Kežman
3 o F Savo Milošević
3 o M Vladimir Jugović
3 o F Darko Pančev
3 o M Dragan Džajić
4 n M Nemanja Gudelj
4 n D Strahinja Pavlović
4 n M Lazar Samardžić
4 n G Vanja Milinković-Savić
`,
  },
  {
    code: "POL",
    adj: "Polish",
    country: "Poland",
    region: "UEFA",
    rows: `
1 n F Robert Lewandowski|lewy
2 o M Zbigniew Boniek
2 o F Grzegorz Lato
2 o G Jerzy Dudek
2 n G Wojciech Szczęsny|szczesny
2 n M Piotr Zieliński
3 o M Kazimierz Deyna
3 n G Łukasz Fabiański
3 n M Jakub Błaszczykowski|kuba
3 n D Łukasz Piszczek
3 n F Arkadiusz Milik
3 n F Krzysztof Piątek
3 n M Grzegorz Krychowiak
3 n D Kamil Glik
3 b G Artur Boruc
4 o F Euzebiusz Smolarek|ebi smolarek
4 o F Włodzimierz Lubański
4 o G Jan Tomaszewski
4 o F Andrzej Szarmach
4 o F Maciej Żurawski
4 n D Jan Bednarek
4 n D Matty Cash
4 n M Sebastian Szymański
4 n M Nicola Zalewski
4 n D Jakub Kiwior
`,
  },
  {
    code: "SWE",
    adj: "Swedish",
    country: "Sweden",
    region: "UEFA",
    nordic: true,
    rows: `
1 b F Zlatan Ibrahimović|zlatan|ibra
1 o F Henrik Larsson
2 o M Freddie Ljungberg|fredrik ljungberg
2 n F Alexander Isak
2 n F Viktor Gyökeres
2 n M Dejan Kulusevski
3 o F Tomas Brolin
3 o F Martin Dahlin
3 o G Thomas Ravelli
3 o F Gunnar Nordahl
3 o M Nils Liedholm
3 b D Olof Mellberg
3 n M Emil Forsberg
3 n D Victor Lindelöf
4 o F Kennet Andersson
4 o F Gunnar Gren
4 o D Patrik Andersson
4 o M Anders Svensson
4 o F Marcus Allbäck
4 b M Kim Källström
4 b F Johan Elmander
4 n M Sebastian Larsson
4 n D Andreas Granqvist
4 n G Robin Olsen
4 n F Marcus Berg
`,
  },
  {
    code: "DEN",
    adj: "Danish",
    country: "Denmark",
    region: "UEFA",
    nordic: true,
    rows: `
1 o M Michael Laudrup
1 o G Peter Schmeichel
1 n M Christian Eriksen
2 o M Brian Laudrup
2 n G Kasper Schmeichel
2 o F Jon Dahl Tomasson
2 b D Daniel Agger
2 n D Simon Kjær|kjaer
2 b F Nicklas Bendtner
2 n M Pierre-Emile Højbjerg|hojbjerg
2 n D Andreas Christensen
2 n F Rasmus Højlund|hojlund
3 o F Allan Simonsen
3 o F Preben Elkjær|elkjaer
3 o F Ebbe Sand
3 o M Thomas Gravesen
3 o M John Jensen
3 b M Dennis Rommedahl
3 n D Joachim Andersen
3 n F Kasper Dolberg
3 n F Yussuf Poulsen
3 n F Martin Braithwaite
3 n M Thomas Delaney
3 n M Mikkel Damsgaard
4 o D Morten Olsen
4 o D Thomas Helveg
4 o M Martin Jørgensen
4 o M Henrik Larsen
4 o M Kim Vilfort
4 o F Flemming Povlsen
4 n D Joakim Mæhle|maehle
`,
  },
  {
    code: "NOR",
    adj: "Norwegian",
    country: "Norway",
    region: "UEFA",
    nordic: true,
    rows: `
1 n F Erling Haaland
1 n M Martin Ødegaard|odegaard
1 o F Ole Gunnar Solskjær|solskjaer|ole
2 o D John Arne Riise
2 o F Tore André Flo
2 n F Alexander Sørloth|sorloth
3 o F John Carew
3 o F Steffen Iversen
3 o D Ronny Johnsen
3 o D Henning Berg
3 b M Morten Gamst Pedersen
3 b D Brede Hangeland
3 n M Sander Berge
3 n F Joshua King
3 n F Antonio Nusa
3 n F Oscar Bobb
4 o M Øyvind Leonhardsen|leonhardsen
4 o M Erik Mykland
4 o F Jan Åge Fjørtoft|fjortoft
4 o D Rune Bratseth
4 o D Stig Inge Bjørnebye|bjornebye
4 o M Kjetil Rekdal
4 n F Mohamed Elyounoussi
`,
  },
  {
    code: "SCO",
    adj: "Scottish",
    country: "Scotland",
    region: "UEFA",
    home: true,
    rows: `
1 o F Kenny Dalglish|king kenny
1 o F Denis Law
1 n D Andrew Robertson|andy robertson|robbo
1 n M Scott McTominay
2 o M Graeme Souness
2 o F Ally McCoist
2 o M Gordon Strachan
2 o M Billy Bremner
2 o D Alan Hansen
2 o M Gary McAllister
2 b M Darren Fletcher
2 b M Scott Brown
2 n D Kieran Tierney
2 n M John McGinn
2 n M Billy Gilmour
3 o M Jim Baxter
3 o M Jimmy Johnstone|jinky
3 o F Joe Jordan
3 o M Archie Gemmill
3 o M John Collins
3 o M Paul Lambert
3 o D Colin Hendry
3 o M Barry Ferguson
3 o F Duncan Ferguson
3 b F James McFadden
3 b F Kenny Miller
3 n G Craig Gordon
3 n F Che Adams
3 n F Steven Fletcher
3 n F Leigh Griffiths
3 n M Callum McGregor
4 o D Danny McGrain
4 o G Jim Leighton
4 o D Willie Miller
4 n G David Marshall
4 n M Ryan Christie
4 n M Lewis Ferguson
4 n D Grant Hanley
4 n D Charlie Mulgrew
`,
  },
  {
    code: "WAL",
    adj: "Welsh",
    country: "Wales",
    region: "UEFA",
    home: true,
    rows: `
1 n F Gareth Bale
1 o M Ryan Giggs
1 o F Ian Rush
2 o F Mark Hughes|sparky
2 o G Neville Southall
2 o F John Charles
2 b F Craig Bellamy
2 o M Gary Speed
2 n M Aaron Ramsey
3 o F Dean Saunders
3 o F John Hartson
3 o M Robbie Savage
3 n M Joe Allen
3 n D Ashley Williams
3 n D Ben Davies
3 n G Wayne Hennessey
3 n F Daniel James
3 n M Harry Wilson
3 n F Kieffer Moore
3 n F Brennan Johnson
3 n F Hal Robson-Kanu|robson kanu
4 o F Ivor Allchurch
4 o M Simon Davies
4 n D Neco Williams
4 n D Joe Rodon
4 n G Danny Ward
4 n M Ethan Ampadu
`,
  },
  {
    code: "IRL",
    adj: "Irish",
    country: "the Republic of Ireland",
    region: "UEFA",
    home: true,
    rows: `
1 o M Roy Keane
1 b F Robbie Keane
2 b M Damien Duff
2 b G Shay Given
2 o D Paul McGrath
2 o M Liam Brady
2 o D Denis Irwin
2 n D Séamus Coleman|seamus coleman
3 o G Packie Bonner
3 o F Niall Quinn
3 o F John Aldridge
3 o F Tony Cascarino
3 o M Ray Houghton
3 o D Steve Staunton
3 b D Richard Dunne
3 b D John O'Shea|oshea
3 n F Shane Long
3 n F Evan Ferguson
3 n G Caoimhín Kelleher|kelleher
4 o M Kevin Kilbane
4 n M James McCarthy
4 n M Jeff Hendrick
4 n M Wes Hoolahan
4 n M Robbie Brady
4 n M Glenn Whelan
4 n G Gavin Bazunu
4 n D Matt Doherty
4 n D Nathan Collins
`,
  },
  {
    code: "NIR",
    adj: "Northern Irish",
    country: "Northern Ireland",
    region: "UEFA",
    home: true,
    rows: `
1 o F George Best
2 o G Pat Jennings
2 o M Danny Blanchflower
3 o M Norman Whiteside
3 b F David Healy
3 n D Jonny Evans
3 n M Steven Davis
3 n D Conor Bradley
4 n D Gareth McAuley
4 o D Aaron Hughes
4 n F Kyle Lafferty
4 o M Martin O'Neill|oneill
`,
  },
  {
    code: "CZE",
    adj: "Czech or Czechoslovak",
    country: "the Czech Republic or Czechoslovakia",
    region: "UEFA",
    rows: `
1 o M Pavel Nedvěd
1 b G Petr Čech
2 b M Tomáš Rosický
2 o F Jan Koller
2 o F Milan Baroš
2 o M Karel Poborský
2 o M Patrik Berger
2 o M Antonín Panenka
2 n F Patrik Schick
2 n M Tomáš Souček
3 o M Vladimír Šmicer
3 o M Josef Masopust
3 o F Josef Bican|pepi bican
3 o D Marek Jankulovski
3 n D Vladimír Coufal
3 n F Adam Hložek
4 o G Ivo Viktor
4 o D Tomáš Ujfaluši
4 o M Tomáš Galásek
4 o F Pavel Kuka
4 o F Tomáš Skuhravý
4 n D Theodor Gebre Selassie
4 n M Jaroslav Plašil
4 n D Ladislav Krejčí
`,
  },
  {
    code: "HUN",
    adj: "Hungarian",
    country: "Hungary",
    region: "UEFA",
    rows: `
1 o F Ferenc Puskás
1 n M Dominik Szoboszlai
2 o F Sándor Kocsis
3 o F Nándor Hidegkuti
3 o F Flórián Albert
3 o F Zoltán Czibor
3 o G Gyula Grosics
3 o M József Bozsik
3 b G Gábor Király
3 b M Zoltán Gera
3 n G Péter Gulácsi
3 n M Balázs Dzsudzsák
3 n D Milos Kerkez
4 o M Lajos Détári
4 n D Willi Orbán
4 n F Roland Sallai
4 n F Ádám Szalai
4 n F Barnabás Varga
`,
  },
  {
    code: "ROU",
    adj: "Romanian",
    country: "Romania",
    region: "UEFA",
    rows: `
1 o M Gheorghe Hagi
2 o D Gheorghe Popescu
2 b F Adrian Mutu
2 o D Dan Petrescu
2 b D Cristian Chivu
3 o F Florin Răducioiu
3 o F Ilie Dumitrescu
3 o F Marius Lăcătuș
3 o G Helmuth Duckadam
3 n M Ianis Hagi
3 n D Radu Drăgușin
4 o G Bogdan Stelea
4 o F Anghel Iordănescu
4 o F Rodion Cămătaru
4 b F Ciprian Marica
4 b D Răzvan Raț
4 n D Vlad Chiricheș
4 n M Nicolae Stanciu
4 n F Dennis Man
`,
  },
  {
    code: "TUR",
    adj: "Turkish",
    country: "Turkey",
    region: "UEFA",
    rows: `
1 o F Hakan Şükür
1 n M Hakan Çalhanoğlu
2 o G Rüştü Reçber|rustu
2 b M Emre Belözoğlu
2 n M Arda Turan
2 n M Arda Güler
2 n F Kenan Yıldız
3 o F Nihat Kahveci
3 b F Tuncay Şanlı
3 b M Hamit Altıntop
3 n F Cenk Tosun
3 n F Burak Yılmaz
3 n D Merih Demiral
3 n D Çağlar Söyüncü
3 n F Kerem Aktürkoğlu
3 n D Ferdi Kadıoğlu
4 o M Yıldıray Baştürk
4 o D Alpay Özalan
4 o D Bülent Korkmaz
4 o F Lefter Küçükandonyadis|lefter
4 o F Metin Oktay
4 o F Tanju Çolak
4 o M Hasan Şaş
4 b G Volkan Demirel
4 n M Selçuk İnan
4 n G Mert Günok
4 n G Altay Bayındır
`,
  },
  {
    code: "USR",
    adj: "Russian, Ukrainian or Soviet",
    country: "Russia, Ukraine or the Soviet Union",
    region: "UEFA",
    rows: `
1 o G Lev Yashin
1 o F Andriy Shevchenko|sheva|andrei shevchenko
2 o F Oleg Blokhin
2 b F Andrey Arshavin|andrei arshavin
2 n G Igor Akinfeev
2 n F Andriy Yarmolenko
2 n D Oleksandr Zinchenko
2 n F Mykhailo Mudryk
2 n F Artem Dovbyk
2 o M Andrei Kanchelskis
3 o F Igor Belanov
3 o G Rinat Dasayev
3 b F Roman Pavlyuchenko
3 b D Yuri Zhirkov
3 n M Aleksandr Golovin
3 n F Artem Dzyuba
3 b F Aleksandr Kerzhakov
3 b M Anatoliy Tymoshchuk
3 o F Serhiy Rebrov
3 o M Aleksandr Mostovoi
3 n M Ruslan Malinovskyi
3 n D Illia Zabarnyi
3 n D Vitaliy Mykolenko
3 n M Georgiy Sudakov
4 o D Viktor Onopko
4 o M Valery Karpin
4 o G Oleksandr Shovkovskyi
4 o M Dmitri Alenichev
4 o F Valentin Ivanov
4 o F Eduard Streltsov
`,
  },
  {
    code: "AUT",
    adj: "Austrian",
    country: "Austria",
    region: "UEFA",
    rows: `
1 n D David Alaba
2 n F Marko Arnautović
2 n M Marcel Sabitzer
2 o F Toni Polster
3 o F Hans Krankl
3 o M Herbert Prohaska
3 o M Andreas Herzog
3 o F Matthias Sindelar
3 n M Konrad Laimer
3 n M Christoph Baumgartner
3 n D Christian Fuchs
4 o D Ernst Happel
4 o D Bruno Pezzey
4 n M Zlatko Junuzović
4 n D Aleksandar Dragović
4 n M Florian Grillitsch
4 n F Michael Gregoritsch
4 n D Sebastian Prödl
4 n D Kevin Danso
4 n F Martin Harnik
`,
  },
  {
    code: "SUI",
    adj: "Swiss",
    country: "Switzerland",
    region: "UEFA",
    rows: `
1 n M Xherdan Shaqiri
1 n M Granit Xhaka
2 n G Yann Sommer
2 n D Manuel Akanji
2 n F Breel Embolo
2 n D Stephan Lichtsteiner
2 o F Alexander Frei
2 o F Stéphane Chapuisat
3 n D Ricardo Rodríguez
3 n F Haris Seferović
3 n M Valon Behrami
3 n M Gökhan Inler
3 n D Johan Djourou
3 b D Philippe Senderos
3 n M Denis Zakaria
3 n D Fabian Schär
3 n F Dan Ndoye
3 n G Gregor Kobel
3 o M Ciriaco Sforza
3 o M Hakan Yakin
4 n M Remo Freuler
4 n D Nico Elvedi
4 n F Ruben Vargas
4 o F Kubilay Türkyilmaz
4 b G Diego Benaglio
4 b M Tranquillo Barnetta
4 n M Blerim Džemaili
`,
  },
  {
    code: "GRE",
    adj: "Greek",
    country: "Greece",
    region: "UEFA",
    rows: `
2 o F Angelos Charisteas
2 o M Theodoros Zagorakis
2 b M Giorgos Karagounis
2 n D Kostas Tsimikas
3 o D Traianos Dellas
3 o G Antonios Nikopolidis
3 b M Kostas Katsouranis
3 n F Georgios Samaras
3 n D Sokratis Papastathopoulos|sokratis
3 n F Kostas Mitroglou
3 n D Kostas Manolas
3 n F Vangelis Pavlidis
3 o M Stelios Giannakopoulos|stelios
4 n D Vasilis Torosidis
4 n F Giorgos Giakoumakis
4 n F Giorgos Masouras
4 o M Vassilis Tsiartas
4 o F Nikos Anastopoulos
4 b F Fanis Gekas
4 o D Giourkas Seitaridis
4 n D Konstantinos Mavropanos
4 n M Anastasios Bakasetas
`,
  },
  {
    code: "NGA",
    adj: "Nigerian",
    country: "Nigeria",
    region: "CAF",
    rows: `
1 o M Jay-Jay Okocha|okocha
1 o F Nwankwo Kanu|kanu
1 n F Victor Osimhen
2 b F Obafemi Martins
2 n M John Obi Mikel|mikel
2 n F Victor Moses
2 n M Wilfred Ndidi
2 n F Ademola Lookman
3 o F Rashidi Yekini
3 o F Daniel Amokachi
3 o M Finidi George
3 o M Sunday Oliseh
3 o D Taribo West
3 o D Celestine Babayaro
3 n G Vincent Enyeama
3 n F Ahmed Musa
3 n F Odion Ighalo
3 n F Kelechi Iheanacho
3 n M Alex Iwobi
3 n F Samuel Chukwueze
3 n F Victor Boniface
3 b F Peter Odemwingie
3 b F Yakubu|yakubu aiyegbeni
3 b D Joseph Yobo
4 o F Emmanuel Amuneke
4 n D Calvin Bassey
4 n F Moses Simon
4 n G Stanley Nwabali
`,
  },
  {
    code: "SEN",
    adj: "Senegalese",
    country: "Senegal",
    region: "CAF",
    rows: `
1 n F Sadio Mané
2 n D Kalidou Koulibaly
2 n G Édouard Mendy
2 o F El Hadji Diouf
2 n M Idrissa Gueye
2 n F Ismaïla Sarr
2 n F Nicolas Jackson
2 n F Demba Ba
3 o M Papa Bouba Diop
3 o F Henri Camara
3 o M Khalilou Fadiga
3 o M Aliou Cissé
3 n M Pape Matar Sarr
3 n M Cheikhou Kouyaté
3 n F Papiss Cissé
3 n F Iliman Ndiaye
4 o D Ferdinand Coly
4 o M Salif Diao
4 n F Moussa Sow
4 n F Mame Biram Diouf
4 n F Boulaye Dia
4 n D Abdou Diallo
4 n M Lamine Camara
4 n M Pape Gueye
`,
  },
  {
    code: "CIV",
    adj: "Ivorian",
    country: "Ivory Coast",
    region: "CAF",
    rows: `
1 b F Didier Drogba
1 n M Yaya Touré
2 b D Kolo Touré
2 b F Salomon Kalou
2 n F Gervinho
2 n F Wilfried Zaha
2 n M Franck Kessié
2 n F Sébastien Haller
2 n F Nicolas Pépé
3 n F Wilfried Bony
3 b D Emmanuel Eboué
3 o M Didier Zokora
3 n D Serge Aurier
3 n D Eric Bailly
3 n M Seko Fofana
3 n F Simon Adingra
3 n F Amad Diallo|amad
4 o F Aruna Dindane
4 o F Bonaventure Kalou
4 o F Laurent Pokou
4 n D Odilon Kossounou
4 n F Max Gradel
4 n M Jean Michaël Seri
4 b D Arthur Boka
`,
  },
  {
    code: "GHA",
    adj: "Ghanaian",
    country: "Ghana",
    region: "CAF",
    rows: `
1 b M Michael Essien
2 o M Abedi Pelé|abedi ayew
2 o F Tony Yeboah
2 b M Sulley Muntari
2 n F Asamoah Gyan
2 o D Samuel Kuffour
2 n M Kevin-Prince Boateng
2 n F André Ayew
2 n M Thomas Partey
2 n M Mohammed Kudus
3 o M Stephen Appiah
3 n F Jordan Ayew
3 n F Antoine Semenyo
3 n F Iñaki Williams
3 n F Christian Atsu
3 n M Kwadwo Asamoah
4 b D John Mensah
4 b G Richard Kingson
4 n M Jeffrey Schlupp
4 n D Daniel Amartey
4 n D Tariq Lamptey
4 n D Mohammed Salisu
`,
  },
  {
    code: "CMR",
    adj: "Cameroonian",
    country: "Cameroon",
    region: "CAF",
    rows: `
1 b F Samuel Eto'o|etoo|eto o
1 o F Roger Milla
2 n M Alex Song
2 n F Vincent Aboubakar
2 n F Eric Maxim Choupo-Moting|choupo moting
2 n G André Onana
2 n F Bryan Mbeumo
3 o D Rigobert Song
3 o F Patrick Mboma
3 o G Thomas N'Kono|nkono
3 o M Marc-Vivien Foé|foe
3 o D Lauren
3 o M Geremi
3 n M Stéphane Mbia
3 n D Benoît Assou-Ekotto|assou ekotto
3 n M André-Frank Zambo Anguissa|anguissa|zambo anguissa
3 n D Joel Matip
4 o G Joseph-Antoine Bell
4 o D Timothée Atouba
4 b G Carlos Kameni
4 n D Nicolas N'Koulou|nkoulou
4 n F Karl Toko Ekambi
4 n F Clinton N'Jie|njie
`,
  },
  {
    code: "EGY",
    adj: "Egyptian",
    country: "Egypt",
    region: "CAF",
    rows: `
1 n F Mohamed Salah|mo salah
2 o M Mohamed Aboutrika
2 n F Omar Marmoush
3 o F Mido|ahmed hossam
3 o F Hossam Hassan
3 b G Essam El-Hadary|el hadary
3 b M Ahmed Hassan
3 b F Amr Zaki
3 n M Mohamed Elneny
4 b F Mohamed Zidan
4 n F Mahmoud Trezeguet
4 n D Ahmed Elmohamady
4 n F Ramadan Sobhi
4 n F Mostafa Mohamed
4 o M Mohamed Barakat
`,
  },
  {
    code: "MAR",
    adj: "Moroccan",
    country: "Morocco",
    region: "CAF",
    rows: `
1 n D Achraf Hakimi
2 n M Hakim Ziyech
2 n G Yassine Bounou|bono
2 n M Sofyan Amrabat
2 n F Youssef En-Nesyri|en nesyri
2 n M Brahim Díaz
3 n D Noussair Mazraoui
3 n D Romain Saïss
3 n D Nayef Aguerd
3 n M Azzedine Ounahi
3 n M Sofiane Boufal
3 n D Mehdi Benatia
3 b F Marouane Chamakh
3 o M Mustapha Hadji
3 o D Noureddine Naybet
4 o G Badou Zaki
4 o M Youssef Chippo
4 o F Salaheddine Bassir
4 n M Younès Belhanda
4 n M Bilal El Khannouss
4 n F Ayoub El Kaabi
4 n M Eliesse Ben Seghir
4 n F Abde Ezzalzouli
`,
  },
  {
    code: "ALG",
    adj: "Algerian",
    country: "Algeria",
    region: "CAF",
    rows: `
1 n F Riyad Mahrez
2 o F Rabah Madjer
2 n M Ismaël Bennacer
3 n F Islam Slimani
3 n M Sofiane Feghouli
3 n M Yacine Brahimi
3 n M Saïd Benrahma
3 n F Baghdad Bounedjah
3 n D Rayan Aït-Nouri|ait nouri
3 b D Madjid Bougherra
4 o M Lakhdar Belloumi
4 o M Karim Ziani
4 o M Mustapha Dahleb
4 b D Antar Yahia
4 n D Youcef Atal
4 n D Aïssa Mandi
4 n F Amine Gouiri
4 n D Rafik Halliche
4 n G Raïs M'Bolhi|mbolhi
`,
  },
  {
    code: "CAF",
    adj: "African",
    country: "other African nations",
    region: "CAF",
    rows: `
1 o F George Weah
1 n F Pierre-Emerick Aubameyang|auba
2 o F Emmanuel Adebayor
2 o F Frédéric Kanouté
2 o M Seydou Keita
2 o D Lucas Radebe
2 b F Benni McCarthy
2 n M Naby Keïta
3 o F Kalusha Bwalya
3 o M Mahamadou Diarra
3 b M Steven Pienaar
3 n M Yves Bissouma
3 n D Chancel Mbemba
3 n F Cédric Bakambu
3 n M Wahbi Khazri
3 n F Serhou Guirassy
`,
  },
  {
    code: "JPN",
    adj: "Japanese",
    country: "Japan",
    region: "AFC",
    rows: `
2 o M Hidetoshi Nakata
2 o M Shunsuke Nakamura
2 n M Shinji Kagawa
2 n M Keisuke Honda
2 n F Shinji Okazaki
2 n F Takumi Minamino
2 n F Kaoru Mitoma
2 n F Takefusa Kubo
3 n D Takehiro Tomiyasu
3 n M Wataru Endo
3 n M Daichi Kamada
3 n M Ritsu Doan
3 n D Maya Yoshida
3 n D Yuto Nagatomo
3 n D Atsuto Uchida
3 n F Junya Ito
3 o F Kazuyoshi Miura|kazu
4 n D Ko Itakura
4 b M Yasuhito Endo
4 o F Kunishige Kamamoto
4 n D Hiroki Sakai
4 n F Ayase Ueda
4 n D Hiroki Ito
4 n G Zion Suzuki
`,
  },
  {
    code: "KOR",
    adj: "South Korean",
    country: "South Korea",
    region: "AFC",
    rows: `
1 n F =Son Heung-min|son|heung min son|sonny|son heungmin
1 b M =Park Ji-sung|park|ji sung park
2 n D =Kim Min-jae|kim min jae|min jae kim
2 n F =Hwang Hee-chan|hwang hee chan|hee chan hwang
2 n M =Lee Kang-in|lee kang in|kang in lee
3 o F =Cha Bum-kun|cha bum kun|cha
3 o D =Hong Myung-bo|hong myung bo
3 o F =Ahn Jung-hwan|ahn jung hwan|ahn
3 o D =Lee Young-pyo|lee young pyo
3 n M =Ki Sung-yueng|ki sung yueng|ki sung yeung
3 n M =Lee Chung-yong|lee chung yong
3 n M =Hwang In-beom|hwang in beom
3 n F =Cho Gue-sung|cho gue sung
4 o F =Seol Ki-hyeon|seol ki hyeon
4 n M =Lee Jae-sung|lee jae sung
4 n F =Ji Dong-won|ji dong won
4 o F =Lee Dong-gook|lee dong gook
`,
  },
  {
    code: "AFC",
    adj: "Asian or Australian",
    country: "other AFC nations",
    region: "AFC",
    rows: `
2 o F Ali Daei
2 n F Mehdi Taremi
2 n F Sardar Azmoun
2 o F Tim Cahill
2 o F Harry Kewell
2 o F Mark Viduka
2 o G Mark Schwarzer
3 o M Mehdi Mahdavikia
3 o M Ali Karimi
3 n F Alireza Jahanbakhsh
3 o F Sami Al-Jaber|al jaber
3 n F Salem Al-Dawsari|al dawsari
3 o D Lucas Neill
3 o M Brett Emerton
3 o M Mark Bresciano
3 n M Mile Jedinak
3 n M Aaron Mooy
3 n G Mathew Ryan|mat ryan
3 n F Mathew Leckie
3 n M Jackson Irvine
3 n F Akram Afif
3 n F Almoez Ali
3 o F Younis Mahmoud
4 o F Majed Abdullah
4 o F Yasser Al-Qahtani|al qahtani
4 o F Archie Thompson
4 n D Harry Souttar
4 o D =Sun Jihai|sun jihai
4 n F =Wu Lei|wu lei
4 o D =Fan Zhiyi|fan zhiyi
`,
  },
  {
    code: "CHI",
    adj: "Chilean",
    country: "Chile",
    region: "CONMEBOL",
    rows: `
1 n F Alexis Sánchez
1 n M Arturo Vidal
2 n G Claudio Bravo
2 o F Iván Zamorano|bam bam
2 o F Marcelo Salas
2 n D Gary Medel
3 n M Charles Aránguiz
3 n F Eduardo Vargas
3 n D Mauricio Isla
3 o D Elías Figueroa
3 n M Matías Fernández
4 n D Jean Beausejour
4 n M Marcelo Díaz
`,
  },
  {
    code: "SAM",
    adj: "South American",
    country: "other South American nations",
    region: "CONMEBOL",
    rows: `
2 o G José Luis Chilavert|chilavert
2 b F Roque Santa Cruz
2 n M Miguel Almirón
2 o F Teófilo Cubillas
2 b F Claudio Pizarro
2 n F Paolo Guerrero
2 n D Antonio Valencia
2 n F Enner Valencia
2 n M Moisés Caicedo
3 o D Carlos Gamarra
3 o D Celso Ayala
3 n F Nelson Haedo Valdez
3 n F Óscar Cardozo
3 n F Julio Enciso
3 b F Salvador Cabañas
3 n F Jefferson Farfán
3 o M Nolberto Solano
3 n D Piero Hincapié
3 n D Pervis Estupiñán
3 o F Agustín Delgado
3 o D Iván Hurtado
3 n F Salomón Rondón
3 o M Marco Etcheverry
4 n F Felipe Caicedo
4 b M Juan Arango
4 n M Tomás Rincón
4 o M Erwin Sánchez
`,
  },
  {
    code: "NAM",
    adj: "North and Central American",
    country: "other CONCACAF nations",
    region: "CONCACAF",
    rows: `
1 n D Alphonso Davies
2 n F Jonathan David
2 n G Keylor Navas
2 o F Dwight Yorke
2 n F Leon Bailey
2 n F Michail Antonio
3 n M Atiba Hutchinson
3 n F Cyle Larin
3 n F Tajon Buchanan
3 n M Stephen Eustáquio
3 n M Bryan Ruiz
3 n F Joel Campbell
3 o F Paulo Wanchope
3 o G Shaka Hislop
3 b F Kenwyne Jones
3 o F Stern John
3 b F David Suazo
3 n M Wilson Palacios
4 o F Carlos Pavón
4 n D Maynor Figueroa
4 n M Celso Borges
`,
  },
  {
    code: "NOR2",
    adj: "Nordic",
    country: "Finland or Iceland",
    region: "UEFA",
    nordic: true,
    rows: `
1 o M Jari Litmanen
2 o D Sami Hyypiä|hyypia
2 b F Eiður Guðjohnsen|eidur gudjohnsen|gudjohnsen
2 n M Gylfi Sigurðsson|gylfi sigurdsson|sigurdsson
3 n F Teemu Pukki
3 b F Mikael Forssell
3 o G Antti Niemi
3 n G Lukas Hradecky
3 n G Hannes Halldórsson|halldorsson
3 n M Aron Gunnarsson
3 n F Alfreð Finnbogason|alfred finnbogason|finnbogason
`,
  },
  {
    code: "YUG",
    adj: "former Yugoslav",
    country: "Slovenia, Bosnia, Montenegro, North Macedonia or Kosovo",
    region: "UEFA",
    yugo: true,
    rows: `
1 n G Jan Oblak
1 n F Edin Džeko
2 n M Miralem Pjanić
2 n F Benjamin Šeško
2 n G Samir Handanović
2 b F Stevan Jovetić
2 o F Mirko Vučinić
2 n F Goran Pandev
3 n M Josip Iličić
3 n D Sead Kolašinac
3 n G Asmir Begović
3 o M Hasan Salihamidžić|brazzo
3 o F Sergej Barbarez
3 n F Vedad Ibišević
3 o M Zlatko Zahovič
3 n M Eljif Elmas
3 n F Vedat Muriqi
`,
  },
];
