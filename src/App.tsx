import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { INITIAL_PANTRY_ITEMS } from './data/initialPantry';
import { BUILTIN_RECIPES } from './data/recipes';
import {
  AppTab,
  CookHistoryEntry,
  DietWeekRecord,
  FamilyPreferences,
  PantryItem,
  Recipe,
  ShoppingItem,
  UsedIngredientLog,
  WifeDietProfile,
} from './types';
import { EvaluatedRecipe, MatchedIngredient } from './utils/recipeMatcher';
import {
  buildBackupPayload,
  loadCustomRecipes,
  loadDietWeeks,
  loadHistory,
  loadPantry,
  loadPrefs,
  loadShoppingList,
  loadWifeProfile,
  parseBackupPayload,
  saveCustomRecipes,
  saveDietWeeks,
  saveHistory,
  savePantry,
  savePrefs,
  saveShoppingList,
  saveWifeProfile,
} from './utils/storage';
import { convertUnit, normalizeVi } from './utils/units';
import { TopNav } from './components/TopNav';
import { RecipeDiscoveryView } from './components/RecipeDiscoveryView';
import { PantryView } from './components/PantryView';
import { WifeDietView } from './components/WifeDietView';
import { ShoppingListView } from './components/ShoppingListView';
import { HistoryView } from './components/HistoryView';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookConfirmModal } from './components/CookConfirmModal';
import { CustomRecipeModal } from './components/CustomRecipeModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('recipes');
  const [pantry, setPantry] = useState<PantryItem[]>(() => loadPantry());
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() =>
    loadShoppingList()
  );
  const [history, setHistory] = useState<CookHistoryEntry[]>(() => loadHistory());
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>(() =>
    loadCustomRecipes()
  );
  const [prefs, setPrefs] = useState<FamilyPreferences>(() => loadPrefs());
  const [dietWeeks, setDietWeeks] = useState<DietWeekRecord[]>(() =>
    loadDietWeeks()
  );
  const [wifeProfile, setWifeProfile] = useState<WifeDietProfile>(() =>
    loadWifeProfile()
  );

  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    savePantry(pantry);
  }, [pantry]);

  useEffect(() => {
    saveShoppingList(shoppingList);
  }, [shoppingList]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveCustomRecipes(customRecipes);
  }, [customRecipes]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    saveDietWeeks(dietWeeks);
  }, [dietWeeks]);

  useEffect(() => {
    saveWifeProfile(wifeProfile);
  }, [wifeProfile]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allRecipes = useMemo(
    () => [...customRecipes, ...BUILTIN_RECIPES],
    [customRecipes]
  );

  const lowStockCount = useMemo(
    () => pantry.filter((i) => i.quantity <= i.lowThreshold).length,
    [pantry]
  );

  const updatePrefs = (patch: Partial<FamilyPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  // Diet handlers
  const handleUpdateWifeProfile = (patch: Partial<WifeDietProfile>) => {
    setWifeProfile((prev) => ({ ...prev, ...patch }));
  };

  const handleUpsertDietWeek = (updatedWeek: DietWeekRecord) => {
    setDietWeeks((prev) => {
      const idx = prev.findIndex((w) => w.weekStart === updatedWeek.weekStart);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedWeek;
        return copy;
      }
      return [updatedWeek, ...prev];
    });
  };

  // Pantry handlers
  const handleAddPantryItem = (item: Omit<PantryItem, 'id' | 'updatedAt'>) => {
    const newItem: PantryItem = {
      ...item,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    setPantry((prev) => [newItem, ...prev]);
    setToast(`Đã thêm "${item.name}" vào kho bếp.`);
  };

  const handleUpdatePantryItem = (id: string, patch: Partial<PantryItem>) => {
    setPantry((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDeletePantryItem = (id: string) => {
    setPantry((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportBackup = () => {
    const payload = buildBackupPayload({
      pantry,
      shoppingList,
      history,
      customRecipes,
      preferences: prefs,
      dietWeeks,
      wifeProfile,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `bep-cua-ton-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast('Đã tải xuống file sao lưu JSON.');
  };

  const handleImportBackup = (
    rawJson: string
  ): { ok: boolean; message: string } => {
    const parsed = parseBackupPayload(rawJson);
    if (!parsed) {
      return {
        ok: false,
        message: 'File JSON không hợp lệ hoặc không đúng định dạng sao lưu BẾP CỦA TÒN.',
      };
    }
    setPantry(parsed.pantry);
    setShoppingList(parsed.shoppingList);
    setHistory(parsed.history);
    setCustomRecipes(parsed.customRecipes);
    setPrefs(parsed.preferences);
    if (parsed.dietWeeks) setDietWeeks(parsed.dietWeeks);
    if (parsed.wifeProfile) setWifeProfile(parsed.wifeProfile);
    return {
      ok: true,
      message: `Đã khôi phục thành công ${parsed.pantry.length} mục trong kho và ${parsed.history.length} lịch sử nấu.`,
    };
  };

  const handleResetSampleData = () => {
    setPantry(INITIAL_PANTRY_ITEMS);
  };

  // Shopping list helpers
  const upsertShoppingItem = (incoming: {
    name: string;
    category: PantryItem['category'];
    quantity: number;
    unit: string;
    sourceRecipeName?: string;
  }) => {
    setShoppingList((prev) => {
      const idx = prev.findIndex(
        (s) => normalizeVi(s.name) === normalizeVi(incoming.name) && !s.checked
      );
      if (idx >= 0) {
        const existing = prev[idx];
        const converted = convertUnit(
          incoming.quantity,
          incoming.unit,
          existing.unit
        );
        const nextQty =
          converted !== null
            ? Math.round((existing.quantity + converted) * 100) / 100
            : existing.quantity;
        const copy = [...prev];
        copy[idx] = {
          ...existing,
          quantity: nextQty,
          sourceRecipeName: incoming.sourceRecipeName ?? existing.sourceRecipeName,
        };
        return copy;
      }

      const newEntry: ShoppingItem = {
        id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: incoming.name,
        category: incoming.category,
        quantity: incoming.quantity,
        unit: incoming.unit,
        checked: false,
        sourceRecipeName: incoming.sourceRecipeName,
        addedAt: new Date().toISOString(),
      };
      return [newEntry, ...prev];
    });
  };

  const handleAddMissingFromRecipe = (
    items: MatchedIngredient[],
    recipeName: string
  ) => {
    for (const m of items) {
      const suggestedQty = m.requiredAmount > 0 ? m.requiredAmount : 1;
      upsertShoppingItem({
        name: m.ingredient.name,
        category: m.ingredient.category,
        quantity: suggestedQty,
        unit: m.ingredient.unit,
        sourceRecipeName: recipeName,
      });
    }
    setToast(`Đã thêm ${items.length} mục vào danh sách đi chợ.`);
  };

  const handleAddPantryItemToShopping = (item: PantryItem) => {
    const restockQty =
      item.unit === 'g' || item.unit === 'ml'
        ? Math.max(200, item.lowThreshold * 4)
        : Math.max(2, item.lowThreshold * 2);
    upsertShoppingItem({
      name: item.name,
      category: item.category,
      quantity: restockQty,
      unit: item.unit,
      sourceRecipeName: 'Bổ sung kho sắp hết',
    });
    setToast(`Đã thêm "${item.name}" vào danh sách đi chợ.`);
  };

  const importShoppingItemIntoPantry = (sItem: ShoppingItem) => {
    setPantry((prev) => {
      const idx = prev.findIndex(
        (p) => normalizeVi(p.name) === normalizeVi(sItem.name)
      );
      if (idx >= 0) {
        const existing = prev[idx];
        const converted = convertUnit(sItem.quantity, sItem.unit, existing.unit);
        const addAmt = converted !== null ? converted : sItem.quantity;
        const copy = [...prev];
        copy[idx] = {
          ...existing,
          quantity: Math.round((existing.quantity + addAmt) * 100) / 100,
          priority:
            existing.category === 'fresh_ingredient' ? 'fresh' : existing.priority,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      }

      const created: PantryItem = {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: sItem.name,
        category: sItem.category,
        quantity: sItem.quantity,
        unit: sItem.unit,
        lowThreshold: sItem.unit === 'g' || sItem.unit === 'ml' ? 50 : 1,
        priority: sItem.category === 'fresh_ingredient' ? 'fresh' : undefined,
        updatedAt: new Date().toISOString(),
      };
      return [created, ...prev];
    });
  };

  const handleImportOneToPantry = (item: ShoppingItem) => {
    importShoppingItemIntoPantry(item);
    setShoppingList((prev) => prev.filter((s) => s.id !== item.id));
    setToast(`Đã nhập "${item.name}" vào kho bếp.`);
  };

  const handleImportCheckedToPantry = () => {
    const checked = shoppingList.filter((s) => s.checked);
    if (checked.length === 0) return;
    for (const item of checked) {
      importShoppingItemIntoPantry(item);
    }
    setShoppingList((prev) => prev.filter((s) => !s.checked));
    setToast(`Đã nhập ${checked.length} mục đã mua vào kho bếp.`);
  };

  // Cook confirmation & deduction
  const handleConfirmCookDeduction = (
    deductions: { pantryItemId: string; amount: number }[],
    usedLogs: UsedIngredientLog[]
  ): PantryItem[] => {
    const newlyDepleted: PantryItem[] = [];

    setPantry((prev) =>
      prev.map((item) => {
        const match = deductions.find((d) => d.pantryItemId === item.id);
        if (!match) return item;
        const nextQty = Math.max(
          0,
          Math.round((item.quantity - match.amount) * 100) / 100
        );
        const updatedItem: PantryItem = {
          ...item,
          quantity: nextQty,
          updatedAt: new Date().toISOString(),
        };
        if (nextQty <= item.lowThreshold) {
          newlyDepleted.push(updatedItem);
        }
        return updatedItem;
      })
    );

    if (cookingRecipe) {
      const historyEntry: CookHistoryEntry = {
        id: `hist-${Date.now()}`,
        recipeId: cookingRecipe.id,
        recipeName: cookingRecipe.name,
        dietary: cookingRecipe.dietary,
        cuisine: cookingRecipe.cuisine,
        method: cookingRecipe.method,
        servings: prefs.servings,
        cookedAt: new Date().toISOString(),
        lowSodiumApplied: prefs.lowSodium,
        lowOilApplied: prefs.lowOil,
        usedIngredients: usedLogs,
      };
      setHistory((prev) => [historyEntry, ...prev]);
    }

    return newlyDepleted;
  };

  const handleAddDepletedToShopping = (items: PantryItem[]) => {
    for (const item of items) {
      handleAddPantryItemToShopping(item);
    }
  };

  const handleSaveCustomRecipe = (recipe: Recipe) => {
    setCustomRecipes((prev) => [recipe, ...prev]);
    setIsCustomModalOpen(false);
    setActiveTab('recipes');
    setDetailRecipe(recipe);
    setToast(`Đã lưu công thức "${recipe.name}".`);
  };

  const handleSelectRecipe = (ev: EvaluatedRecipe) => {
    setDetailRecipe(ev.recipe);
  };

  const handleQuickCook = (ev: EvaluatedRecipe) => {
    setCookingRecipe(ev.recipe);
  };

  const handleUpdateHistoryEntry = (
    id: string,
    patch: Partial<CookHistoryEntry>
  ) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setToast('Đã xóa mục lịch sử.');
  };

  const handleAddCheckinEntry = (entry: CookHistoryEntry) => {
    setHistory((prev) => [entry, ...prev]);
    setToast(`Đã lưu check-in "${entry.recipeName}" vào lịch sử gia đình.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F7] text-[#181A18] pb-20 md:pb-10">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCustomRecipe={() => setIsCustomModalOpen(true)}
        shoppingCount={shoppingList.length}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div key={activeTab} className="smooth-view-enter">
        {activeTab === 'recipes' && (
          <RecipeDiscoveryView
            recipes={allRecipes}
            pantry={pantry}
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onSelectRecipe={handleSelectRecipe}
            onQuickCook={handleQuickCook}
            onOpenCustomRecipe={() => setIsCustomModalOpen(true)}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryView
            pantry={pantry}
            onAddItem={handleAddPantryItem}
            onUpdateItem={handleUpdatePantryItem}
            onDeleteItem={handleDeletePantryItem}
            onAddToShopping={handleAddPantryItemToShopping}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetSampleData={handleResetSampleData}
          />
        )}

        {activeTab === 'diet' && (
          <WifeDietView
            weeks={dietWeeks}
            profile={wifeProfile}
            recipes={allRecipes}
            onUpdateProfile={handleUpdateWifeProfile}
            onUpsertWeek={handleUpsertDietWeek}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            items={shoppingList}
            onAddManual={(item) => {
              upsertShoppingItem(item);
              setToast(`Đã thêm "${item.name}" vào danh sách đi chợ.`);
            }}
            onToggleChecked={(id) =>
              setShoppingList((prev) =>
                prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
              )
            }
            onUpdateQty={(id, qty) =>
              setShoppingList((prev) =>
                prev.map((s) => (s.id === id ? { ...s, quantity: qty } : s))
              )
            }
            onDelete={(id) =>
              setShoppingList((prev) => prev.filter((s) => s.id !== id))
            }
            onImportOneToPantry={handleImportOneToPantry}
            onImportCheckedToPantry={handleImportCheckedToPantry}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            entries={history}
            onClearHistory={() => {
              setHistory([]);
              setToast('Đã xóa toàn bộ lịch sử nấu.');
            }}
            onUpdateEntry={handleUpdateHistoryEntry}
            onDeleteEntry={handleDeleteHistoryEntry}
            onAddCheckinEntry={handleAddCheckinEntry}
            onNotify={setToast}
          />
        )}
        </div>
      </main>

      {/* Modals */}
      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          pantry={pantry}
          prefs={prefs}
          onUpdatePrefs={updatePrefs}
          onClose={() => setDetailRecipe(null)}
          onAddMissingToShopping={handleAddMissingFromRecipe}
          onStartCookConfirm={() => {
            setCookingRecipe(detailRecipe);
            setDetailRecipe(null);
          }}
        />
      )}

      {cookingRecipe && (
        <CookConfirmModal
          recipe={cookingRecipe}
          pantry={pantry}
          prefs={prefs}
          onClose={() => setCookingRecipe(null)}
          onConfirmDeduction={handleConfirmCookDeduction}
          onAddDepletedToShopping={handleAddDepletedToShopping}
        />
      )}

      {isCustomModalOpen && (
        <CustomRecipeModal
          pantry={pantry}
          onClose={() => setIsCustomModalOpen(false)}
          onSaveRecipe={handleSaveCustomRecipe}
        />
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Subtle Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 text-stone-300 hover:text-white cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
