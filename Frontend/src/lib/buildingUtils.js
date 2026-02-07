export const buildingTypes = [
    { name: "Home", maxRooms: 10 },
    { name: "Restaurant", maxRooms: 10 },
    { name: "City Hall", maxRooms: 7 },
    { name: "School", maxRooms: 15 },
    { name: "Hospital", maxRooms: 20 },
    { name: "Police Station", maxRooms: 10 },
    { name: "Fire Station", maxRooms: 8 },
    { name: "Apartment Complex", maxRooms: 50 },
    { name: "Library", maxRooms: 12 },
    { name: "Art Gallery", maxRooms: 10 },
    { name: "Mall", maxRooms: 40 },
    { name: "Factory", maxRooms: 20 },
    { name: "Warehouse", maxRooms: 15 },
    { name: "Park", maxRooms: 5 },
    { name: "Stadium", maxRooms: 30 },
    { name: "Hotel", maxRooms: 25 },
    { name: "Museum", maxRooms: 12 },
    { name: "University", maxRooms: 25 },
    { name: "Bank", maxRooms: 8 },
    { name: "Train Station", maxRooms: 10 },
    { name: "Airport", maxRooms: 20 },
    { name: "Power Plant", maxRooms: 10 },
    { name: "Farm", maxRooms: 8 },
    { name: "Cinema", maxRooms: 7 },
    { name: "Theater", maxRooms: 8 },
    { name: "Embassy", maxRooms: 6 },
    { name: "Church", maxRooms: 10 },
    { name: "Amusement Park", maxRooms: 25 },
    { name: "Military Base", maxRooms: 15 },
    { name: "Marketplace", maxRooms: 20 },
    { name: "Research Lab", maxRooms: 10 },
    { name: "Castle", maxRooms: 30 },
    { name: "Royal Barracks", maxRooms: 15 },
    { name: "Knight Academy", maxRooms: 10 },
    { name: "Royal Treasury", maxRooms: 8 },
    { name: "Monastery", maxRooms: 12 },
    { name: "Presidential Palace", maxRooms: 20 }
]

export const imageRequirements = [
    {
        name: 'quality',
        text: "Ensure the Image is a backgroundless building <Preferrably 3D>.",
        link: "https://www.cleanpng.com/png-modern-luxury-house-design-8394021/",
        linkAction: 'to get cool images'
    }, 
    {
        name: 'size',
        text: "The Image must not be larger than 300Kb.",
        link: "https://squoosh.app/",
        linkAction: 'to Compress'
    },
    {
        name: 'format',
        text: "The Image must be in .Avif or .Webp format.",
        link: 'https://picflow.com/convert/png-to-avif',
        linkAction: 'to Convert'
    },
    {
        name: 'roomSize',
        text: "The rooms should not exceed",
        maxNumber: 20
    },
    {
        name: 'participants',
        text: "Max Participants should not be more than",
        maxUsers: 400
    },
]


export const convertToNumber = (value, setter, minValue, forPrice = false) => {
    if (forPrice) {
        const valid = /^[\d.,]*$/.test(value)
        if (!valid) return

        const cleanedValue = value.replace(/,/g, '')
        const numberValue = Number(cleanedValue)

        if (value === '' || isNaN(numberValue)) {
            setter(minValue)
            return
        }

        const parts = cleanedValue.split('.')
        const integerPart = parts[0]
        const decimalPart = parts[1]

        const formattedInteger = parseInt(integerPart, 10).toLocaleString('en-US')
        const formattedValue = decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger

        setter(formattedValue)
    } else {
        if (/^\d*$/.test(value)) {
            const numberValue = Number(value)

            if (value === '') {
                setter(minValue)
                return
            }

            setter(Math.max(minValue, numberValue))
        }
    }
}