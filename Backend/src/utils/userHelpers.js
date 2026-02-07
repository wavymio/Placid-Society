export function rangeFromNegativeToPositive(num) {
  const result = []
  for (let i = -num; i <= num; i++) {
    result.push(i);
  }
  return result
}

export const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)]

export const mins = {
    male: {
        musc: 0,
        width: 15
    }, 
    female: {
        musc: 0,
        width: 20,
        curve: 0
    }
}

export const maxs = {
    male: {
        musc: 30,
        width: 40
    }, 
    female: {
        musc: 20,
        width: 40,
        curve: 40
    }
}

export const statMaxs = {
    health: 100,
    energy: 100,        
    endurance: "__INF__",
    strength: "__INF__",
    smarts: "__INF__",       
    speed: "__INF__",
    damage: 3,
    immunity: "__INF__",
    lgn: "__INF__",
}

export const statMins = {
    health: 0,
    energy: 0,        
    endurance: 0,
    strength: 0,
    smarts: 0,       
    speed: 0,
    damage: 0,
    immunity: 0,
    lgn: 0,
}
