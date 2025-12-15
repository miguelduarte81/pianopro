import helloMidi from '../assets/midi/Adele - Hello.mid?url'
import heyJudeMidi from '../assets/midi/Beatles - Hey Jude.mid?url'
import perfectMidi from '../assets/midi/Ed Sheeran - Perfect.mid?url'
import clocksMidi from '../assets/midi/Coldplay - Clocks.mid?url'
import yellowMidi from '../assets/midi/Coldplay - Yellow.mid?url'
import riverMidi from '../assets/midi/Yiruma - River Flows in You.mid?url'
import allOfMeMidi from '../assets/midi/John Legend - All of Me.mid?url'
import interstellarMidi from '../assets/midi/Hans Zimmer - Interstellar.mid?url'
import moonlightSonataMidi from '../assets/midi/Beethoven - Moonlight Sonata.mid?url'
import noTimeToDieMidi from '../assets/midi/Billie Eilish - No Time To Die.mid?url'
import talkingToTheMoonMidi from '../assets/midi/Bruno Mars - Talking to the moon.mid?url'
import thousandYearsMidi from '../assets/midi/Christina Perri - A Thousand Years.mid?url'
import gameOfThronesMidi from '../assets/midi/Game of Thrones - Main Theme.mid?url'
import takeMeToChurchMidi from '../assets/midi/Hozier - Take Me to Church.mid?url'
import somewhereOnlyWeKnowMidi from '../assets/midi/Keane - Somewhere Only We Know.mid?url'
import infinityMidi from '../assets/midi/Jaymes Young - Infinity.mid?url'
import faintMidi from '../assets/midi/Linkin Park - Faint.mid?url'
import preludeMidi from '../assets/midi/Johann Sebastian Bach - 1st Prelude.mid?url'
import canonMidi from '../assets/midi/Johann Pachelbel - Canon in D.mid?url'
// import youngAndBeautifulMidi from '../assets/midi/Lana Del Rey - Young and Beautiful.mid?url'
import someoneYouLovedMidi from '../assets/midi/Lewis Capaldi - Someone You Loved.mid?url'

export const songs = [
  {
    id: 'interstellar',
    title: 'Interstellar Main Theme',
    author: 'Hans Zimmer',
    midiUrl: interstellarMidi,
    image: '/covers/interstellar.jpg',
    category: 'Soundtrack',
    level: 'Hard'
  },
  {
    id: 'hello',
    title: 'Hello',
    author: 'Adele',
    midiUrl: helloMidi,
    image: '/covers/hello.jpg',
    category: 'Pop',
    level: 'Easy'
  },
  {
    id: 'hey-jude',
    title: 'Hey Jude',
    author: 'The Beatles',
    midiUrl: heyJudeMidi,
    image: '/covers/hey_jude.jpg',
    category: 'Pop',
    level: 'Hard'
  },
  {
    id: 'clocks',
    title: 'Clocks',
    author: 'Coldplay',
    midiUrl: clocksMidi,
    image: '/covers/clocks.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'yellow',
    title: 'Yellow',
    author: 'Coldplay',
    midiUrl: yellowMidi,
    image: '/covers/yellow.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'perfect',
    title: 'Perfect',
    author: 'Ed Sheeran',
    midiUrl: perfectMidi,
    image: '/covers/perfect.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'all-of-me',
    title: 'All of Me',
    author: 'John Legend',
    midiUrl: allOfMeMidi,
    image: '/covers/all_of_me.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'river',
    title: 'River Flows in You',
    author: 'Yiruma',
    midiUrl: riverMidi,
    image: '/covers/river_flows_in_you.jpg',
    category: 'New Age',
    level: 'Medium'
  },
  {
    id: 'moonlight-sonata',
    title: 'Moonlight Sonata',
    author: 'Beethoven',
    midiUrl: moonlightSonataMidi,
    image: '/covers/moonlight_sonata.jpg',
    category: 'Classical',
    level: 'Hard'
  },
  {
    id: 'no-time-to-die',
    title: 'No Time To Die',
    author: 'Billie Eilish',
    midiUrl: noTimeToDieMidi,
    image: '/covers/no_time_to_die.jpg',
    category: 'Soundtrack',
    level: 'Medium'
  },
  {
    id: 'talking-to-the-moon',
    title: 'Talking To The Moon',
    author: 'Bruno Mars',
    midiUrl: talkingToTheMoonMidi,
    image: '/covers/talking_to_the_moon.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'thousand-years',
    title: 'A Thousand Years',
    author: 'Christina Perri',
    midiUrl: thousandYearsMidi,
    image: '/covers/thousand_years.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'game-of-thrones',
    title: 'Game of Thrones',
    author: 'Main Theme',
    midiUrl: gameOfThronesMidi,
    image: '/covers/game_of_thrones.jpg',
    category: 'Soundtrack',
    level: 'Hard'
  },
  {
    id: 'take-me-to-church',
    title: 'Take Me To Church',
    author: 'Hozier',
    midiUrl: takeMeToChurchMidi,
    image: '/covers/take_me_to_church.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'somewhere-only-we-know',
    title: 'Somewhere Only We Know',
    author: 'Keane',
    midiUrl: somewhereOnlyWeKnowMidi,
    image: '/covers/somewhere_only_we_know.jpg',
    category: 'Pop',
    level: 'Medium'
  }, 
  {
    id: 'infinity',
    title: 'Infinity',
    author: 'Jaymes Young',
    midiUrl: infinityMidi,
    image: '/covers/infinity.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'faint',
    title: 'Faint',
    author: 'Linkin Park',
    midiUrl: faintMidi,
    image: '/covers/faint.jpg',
    category: 'Pop',
    level: 'Medium'
  },
  {
    id: 'prelude',
    title: 'Prelude no.1',
    author: 'Johann Sebastian Bach',
    midiUrl: preludeMidi,
    image: '/covers/prelude.jpg',
    category: 'Classical',
    level: 'Hard'
  },
  {
    id: 'canon',
    title: 'Canon in D',
    author: 'Johann Pachelbel',
    midiUrl: canonMidi,
    image: '/covers/canon_in_d.jpg',
    category: 'Classical',
    level: 'Hard'
  },
  // {
  //   id: 'young-and-beautiful',
  //   title: 'Young and Beautiful',
  //   author: 'Lana Del Rey',
  //   midiUrl: youngAndBeautifulMidi,
  //   image: '/covers/young_and_beautiful.jpg',
  //   category: 'Pop',
  //   level: 'Medium'
  // },
  {
    id: 'someone-you-loved',
    title: 'Someone You Loved',
    author: 'Lewis Capaldi',
    midiUrl: someoneYouLovedMidi,
    image: '/covers/someone_you_loved.jpg',
    category: 'Pop',
    level: 'Medium'
  }
]
