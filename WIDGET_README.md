# 📱 Widget "Activités du jour" - Love Dice

Ce guide explique comment implémenter un widget iOS/Android pour afficher les activités du jour (résultats des dés) directement sur l'écran d'accueil.

## 🎯 **Objectif du Widget**

Afficher sur l'écran d'accueil :
- **Date du jour**
- **Activité 1** (premier dé)
- **Activité 2** (deuxième dé) 
- **Activité 3** (troisième dé)
- **Restaurant suggéré** (si repas)
- **Bouton "Ouvrir l'app"**

## 📦 **Installation**

### 1. Installer la librairie
```bash
npm install react-native-widget-extension
# ou
yarn add react-native-widget-extension
```

### 2. Configuration iOS (Xcode)
```bash
cd ios && pod install
```

### 3. Configuration Android
Ajouter dans `android/app/build.gradle` :
```gradle
android {
    compileSdkVersion 33
    // ... autres configs
}
```

## 🏗️ **Structure du Projet**

```
love-dice/
├── app/
├── components/
├── services/
├── widgets/                    # 📁 Nouveau dossier
│   ├── WidgetDataManager.ts    # Gestion des données
│   ├── WidgetConfig.ts         # Configuration
│   └── types/
│       └── WidgetTypes.ts      # Types TypeScript
└── WIDGET_README.md
```

## 📝 **1. Types TypeScript**

Créer `widgets/types/WidgetTypes.ts` :
```typescript
export interface WidgetDiceResult {
  id: string;
  date: string;
  activities: {
    repas: string;
    activite: string;
    moment: string;
  };
  restaurant?: {
    name: string;
    cuisine: string;
    address: string;
  };
}

export interface WidgetData {
  lastResult: WidgetDiceResult | null;
  isActive: boolean;
  lastUpdated: string;
}
```

## 🔧 **2. Gestionnaire de Données**

Créer `widgets/WidgetDataManager.ts` :
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetData, WidgetDiceResult } from './types/WidgetTypes';

const WIDGET_DATA_KEY = 'love_dice_widget_data';

export class WidgetDataManager {
  // Sauvegarder les données du widget
  static async saveWidgetData(data: WidgetDiceResult): Promise<void> {
    try {
      const widgetData: WidgetData = {
        lastResult: data,
        isActive: true,
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
      
      // Notifier le widget de la mise à jour
      // (selon la librairie utilisée)
    } catch (error) {
      console.error('Erreur sauvegarde widget:', error);
    }
  }

  // Récupérer les données du widget
  static async getWidgetData(): Promise<WidgetData | null> {
    try {
      const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur récupération widget:', error);
      return null;
    }
  }

  // Désactiver le widget
  static async disableWidget(): Promise<void> {
    try {
      const data = await this.getWidgetData();
      if (data) {
        data.isActive = false;
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Erreur désactivation widget:', error);
    }
  }
}
```

## ⚙️ **3. Configuration du Widget**

Créer `widgets/WidgetConfig.ts` :
```typescript
import { Platform } from 'react-native';

export const WidgetConfig = {
  // Configuration iOS
  ios: {
    bundleIdentifier: 'com.lovedice.app.widget', // À adapter
    displayName: 'Love Dice Widget',
    supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
  },
  
  // Configuration Android
  android: {
    packageName: 'com.lovedice.app', // À adapter
    className: 'LoveDiceWidgetProvider',
    updateInterval: 1800000, // 30 minutes
  },
  
  // Configuration commune
  common: {
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    fallbackData: {
      activities: {
        repas: 'Aucun',
        activite: 'Aucune',
        moment: 'Aucun',
      },
      restaurant: null,
    },
  },
};
```

## 🔗 **4. Intégration dans l'App**

### Modifier `components/ui/ResultsDrawer.tsx` :
```typescript
import { WidgetDataManager } from '../../widgets/WidgetDataManager';

// Dans la fonction handleShowRestaurants ou après le lancement des dés
const saveToWidget = async (diceResults: any) => {
  const widgetData = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('fr-FR'),
    activities: {
      repas: diceResults[0]?.label || 'Aucun',
      activite: diceResults[1]?.label || 'Aucune', 
      moment: diceResults[2]?.label || 'Aucun',
    },
    restaurant: restaurantData, // Si restaurant trouvé
  };
  
  await WidgetDataManager.saveWidgetData(widgetData);
};
```

## 📱 **5. Code Natif du Widget**

### iOS (Swift) - `ios/LoveDiceWidget/LoveDiceWidget.swift` :
```swift
import WidgetKit
import SwiftUI

struct LoveDiceWidget: Widget {
    let kind: String = "LoveDiceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LoveDiceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Love Dice")
        .description("Affiche vos activités du jour")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), activities: ["Repas", "Activité", "Moment"])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), activities: ["Repas", "Activité", "Moment"])
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Récupérer les données depuis UserDefaults
        let userDefaults = UserDefaults(suiteName: "group.com.lovedice.app")
        let activities = userDefaults?.stringArray(forKey: "widget_activities") ?? ["Aucune activité"]
        
        let entry = SimpleEntry(date: Date(), activities: activities)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let activities: [String]
}

struct LoveDiceWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.pink)
                Text("Love Dice")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
                Text(entry.date, style: .date)
                    .font(.caption)
            }
            
            ForEach(entry.activities, id: \.self) { activity in
                HStack {
                    Image(systemName: "dice.fill")
                        .foregroundColor(.blue)
                    Text(activity)
                        .font(.subheadline)
                }
            }
        }
        .padding()
    }
}
```

### Android (Kotlin) - `android/app/src/main/java/com/lovedice/app/LoveDiceWidgetProvider.kt` :
```kotlin
package com.lovedice.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences

class LoveDiceWidgetProvider : AppWidgetProvider() {
    
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val prefs = context.getSharedPreferences("love_dice_widget", Context.MODE_PRIVATE)
        val activities = prefs.getStringSet("activities", setOf("Aucune activité")) ?: setOf("Aucune activité")
        
        val views = RemoteViews(context.packageName, R.layout.widget_love_dice)
        
        // Mettre à jour le texte
        views.setTextViewText(R.id.widget_title, "Love Dice")
        views.setTextViewText(R.id.widget_date, java.text.SimpleDateFormat("dd MMM", java.util.Locale.getDefault()).format(java.util.Date()))
        
        // Mettre à jour les activités
        activities.forEachIndexed { index, activity ->
            when (index) {
                0 -> views.setTextViewText(R.id.activity_1, "🍽️ $activity")
                1 -> views.setTextViewText(R.id.activity_2, "🎬 $activity") 
                2 -> views.setTextViewText(R.id.activity_3, "⏰ $activity")
            }
        }
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

## 🎨 **6. Layout Android**

Créer `android/app/src/main/res/layout/widget_love_dice.xml` :
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_background">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <ImageView
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:src="@drawable/ic_heart"
            android:layout_marginEnd="8dp" />

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Love Dice"
            android:textSize="16sp"
            android:textStyle="bold"
            android:textColor="#E0115F" />

        <TextView
            android:id="@+id/widget_date"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="15 Jan"
            android:textSize="12sp"
            android:textColor="#666666" />

    </LinearLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:layout_marginTop="12dp">

        <TextView
            android:id="@+id/activity_1"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="🍽️ Repas: Italien"
            android:textSize="14sp"
            android:textColor="#333333"
            android:layout_marginBottom="4dp" />

        <TextView
            android:id="@+id/activity_2"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="🎬 Activité: Cinéma"
            android:textSize="14sp"
            android:textColor="#333333"
            android:layout_marginBottom="4dp" />

        <TextView
            android:id="@+id/activity_3"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="⏰ Moment: Soirée"
            android:textSize="14sp"
            android:textColor="#333333" />

    </LinearLayout>

</LinearLayout>
```

## 🔧 **7. Configuration App Groups (iOS)**

Dans `ios/LoveDice.xcodeproj` :
1. Ajouter un App Group : `group.com.lovedice.app`
2. Partager les données entre l'app et le widget

## 📱 **8. Manifest Android**

Ajouter dans `android/app/src/main/AndroidManifest.xml` :
```xml
<receiver android:name=".LoveDiceWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/love_dice_widget_info" />
</receiver>
```

## 🚀 **9. Utilisation**

```typescript
// Dans ton app React Native
import { WidgetDataManager } from './widgets/WidgetDataManager';

// Après avoir lancé les dés
const handleDiceRoll = async (results: DiceResult[]) => {
  // ... logique existante ...
  
  // Sauvegarder pour le widget
  await WidgetDataManager.saveWidgetData({
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('fr-FR'),
    activities: {
      repas: results[0]?.label || 'Aucun',
      activite: results[1]?.label || 'Aucune',
      moment: results[2]?.label || 'Aucun',
    },
    restaurant: selectedRestaurant,
  });
};
```

## 🎯 **Résultat Final**

Le widget affichera sur l'écran d'accueil :
```
┌─────────────────────────┐
│ ❤️ Love Dice   15 Jan  │
├─────────────────────────┤
│ 🍽️ Repas: Italien      │
│ 🎬 Activité: Cinéma    │
│ ⏰ Moment: Soirée      │
│ 📍 Pasta & Co          │
└─────────────────────────┘
```

## 📚 **Ressources Utiles**

- [react-native-widget-extension](https://github.com/react-native-widget-extension/react-native-widget-extension)
- [iOS WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Android App Widgets](https://developer.android.com/guide/topics/appwidgets)

## ⚠️ **Notes Importantes**

1. **Test sur vrais appareils** : Les widgets ne fonctionnent pas sur simulateur
2. **Permissions** : Vérifier les permissions de stockage partagé
3. **Performance** : Limiter les mises à jour fréquentes
4. **Fallbacks** : Toujours prévoir des données par défaut

---

**Prêt à implémenter ?** Commence par créer la structure de dossiers et les types TypeScript ! 🚀
