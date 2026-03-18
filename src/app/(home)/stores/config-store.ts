import { create } from 'zustand'
import siteContent from '@/config/site-content.json'
import cardStyles from '@/config/card-styles.json'

export type SiteContent = typeof siteContent
export type CardStyles = typeof cardStyles

interface ConfigStore {
	siteContent: SiteContent
	cardStyles: CardStyles
	regenerateKey: number
	configDialogOpen: boolean
	setSiteContent: (content: SiteContent) => void
	setCardStyles: (styles: CardStyles) => void
	resetSiteContent: () => void
	resetCardStyles: () => void
	regenerateBubbles: () => void
	setConfigDialogOpen: (open: boolean) => void
}

// 从localStorage加载配置
const loadFromLocalStorage = () => {
    // 💡 关键修改：增加这一行判断
    if (typeof window === 'undefined') {
        return {
            siteContent: { ...siteContent },
            cardStyles: { ...cardStyles }
        }
    }

    try {
        const savedSiteContent = localStorage.getItem('siteContent')
        const savedCardStyles = localStorage.getItem('cardStyles')

        return {
            siteContent: savedSiteContent ? JSON.parse(savedSiteContent) : { ...siteContent },
            cardStyles: savedCardStyles ? JSON.parse(savedCardStyles) : { ...cardStyles }
        }
    } catch (error) {
        console.error('Failed to load config from localStorage:', error)
        return {
            siteContent: { ...siteContent },
            cardStyles: { ...cardStyles }
        }
    }
}

// 保存配置到localStorage
const saveToLocalStorage = (siteContent: SiteContent, cardStyles: CardStyles) => {
	try {
		localStorage.setItem('siteContent', JSON.stringify(siteContent))
		localStorage.setItem('cardStyles', JSON.stringify(cardStyles))
	} catch (error) {
		console.error('Failed to save config to localStorage:', error)
	}
}

export const useConfigStore = create<ConfigStore>((set, get) => {
	const initialConfig = loadFromLocalStorage()
	
	return {
		siteContent: initialConfig.siteContent,
		cardStyles: initialConfig.cardStyles,
		regenerateKey: 0,
		configDialogOpen: false,
		setSiteContent: (content: SiteContent) => {
			set({ siteContent: content })
			// 保存到localStorage
			saveToLocalStorage(content, get().cardStyles)
		},
		setCardStyles: (styles: CardStyles) => {
			set({ cardStyles: styles })
			// 保存到localStorage
			saveToLocalStorage(get().siteContent, styles)
		},
		resetSiteContent: () => {
			set({ siteContent: { ...siteContent } })
			// 保存到localStorage
			saveToLocalStorage({ ...siteContent }, get().cardStyles)
		},
		resetCardStyles: () => {
			set({ cardStyles: { ...cardStyles } })
			// 保存到localStorage
			saveToLocalStorage(get().siteContent, { ...cardStyles })
		},
		regenerateBubbles: () => {
			set(state => ({ regenerateKey: state.regenerateKey + 1 }))
		},
		setConfigDialogOpen: (open: boolean) => {
			set({ configDialogOpen: open })
		}
	}
})

