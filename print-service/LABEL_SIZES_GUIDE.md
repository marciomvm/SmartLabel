# 📏 Guia de Tamanhos de Labels - Niimbot B1

## 📊 Tamanhos Suportados pela B1

### **Largura Suportada**
- **Mínimo**: 20mm (0.79")
- **Máximo**: 50mm (1.97")
- **Nativo**: 48mm (384 pixels a 203 DPI)

### **Tamanhos Comuns Disponíveis**

| Tamanho (mm) | Tamanho (polegadas) | Pixels (203 DPI) | Uso Comum | Disponível |
|--------------|-------------------|------------------|-----------|------------|
| **15x30** | 0.59" x 1.18" | 118x236 | Pequenos códigos, arquivos | ✅ |
| **20x30** | 0.79" x 1.18" | 157x236 | Etiquetas pequenas | ✅ |
| **30x15** | 1.18" x 0.59" | 236x118 | Etiquetas horizontais | ✅ |
| **40x30** | 1.57" x 1.18" | 315x236 | **Padrão atual** | ✅ |
| **50x30** | 1.97" x 1.18" | 394x236 | Etiquetas maiores | ✅ |
| **40x70** | 1.57" x 2.76" | 315x551 | Etiquetas longas | ✅ |
| **50x80** | 1.97" x 3.15" | 394x630 | Etiquetas grandes | ✅ |
| **50x50** | 1.97" x 1.97" | 394x394 | Etiquetas quadradas | ✅ |

## 🎯 Tamanho Atual do Sistema

### **Configuração Atual**
```python
# label_generator.py - Linha 12
W, H = 384, 240  # 48x30mm (aproximadamente)
```

**Análise:**
- ✅ **Largura**: 384px = 48mm (dentro do limite de 50mm)
- ✅ **Altura**: 240px = 30mm (tamanho padrão)
- ✅ **Compatível** com labels **40x30mm** e **50x30mm**

## 🛒 Labels Recomendadas para Seu Sistema

### **1. Tamanho Atual (Recomendado)**
- **40x30mm** (1.57" x 1.18")
- **Pixels**: 315x236 (seu sistema usa 384x240)
- **Vantagem**: QR code + texto cabem perfeitamente
- **Amazon**: "NIIMBOT Labels 40x30mm" - 230 labels/roll

### **2. Tamanho Maior (Opcional)**
- **50x30mm** (1.97" x 1.18")
- **Pixels**: 394x236
- **Vantagem**: Mais espaço para texto
- **Amazon**: "NIIMBOT Labels 50x30mm" - 200 labels/roll

### **3. Tamanho Longo (Para mais informações)**
- **40x70mm** (1.57" x 2.76")
- **Pixels**: 315x551
- **Vantagem**: Muito espaço para detalhes
- **Amazon**: "NIIMBOT Labels 40x70mm" - 110 labels/roll

## 🔧 Como Ajustar o Sistema

### **Para 50x30mm (Maior)**
```python
# label_generator.py
W, H = 394, 236  # 50x30mm
qr_size = 200    # QR code mantém tamanho
text_x = 250     # Mais espaço para texto
```

### **Para 40x70mm (Longo)**
```python
# label_generator.py
W, H = 315, 551  # 40x70mm
qr_size = 200    # QR code no topo
# Layout vertical: QR code acima, texto abaixo
```

### **Para 15x30mm (Pequeno)**
```python
# label_generator.py
W, H = 118, 236  # 15x30mm
qr_size = 100    # QR code menor
# Apenas QR code, sem texto
```

## 🧪 Teste de Tamanhos

Vou criar um script para testar diferentes tamanhos:

```python
# test_label_sizes.py
def test_size(width_mm, height_mm):
    # Converter mm para pixels (203 DPI)
    W = int(width_mm * 203 / 25.4)
    H = int(height_mm * 203 / 25.4)
    
    # Gerar label de teste
    generate_test_label(W, H, f"test_{width_mm}x{height_mm}.png")
    
    # Imprimir
    print_with_niimblue(f"test_{width_mm}x{height_mm}.png")
```

## 📦 Onde Comprar Labels

### **Brasil**
- **Mercado Livre**: "Etiqueta Niimbot B1 40x30mm"
- **Amazon Brasil**: "NIIMBOT Labels"
- **AliExpress**: "Niimbot B1 Label Paper"

### **Especificações para Compra**
- ✅ **Compatível com**: B1, B21, B3S
- ✅ **Tipo**: Thermal (térmico)
- ✅ **Adesivo**: Sim
- ✅ **Resistente**: Água, óleo, rasgos
- ✅ **Cor**: Branco (fundo)

## 💡 Recomendações

### **Para Seu Sistema de Cogumelos**

1. **Mantenha 40x30mm** - Funciona perfeitamente
2. **Considere 50x30mm** - Mais espaço para strain names longos
3. **Evite 15x30mm** - Muito pequeno para QR + texto
4. **Teste 40x70mm** - Se quiser adicionar mais informações

### **Otimização do Layout**

```python
# Para 50x30mm (mais espaço)
def generate_label_50x30(batch_id, strain, date):
    W, H = 394, 236  # 50x30mm
    
    # QR code: 180x180 (menor)
    # Texto: Mais linhas, fonte maior
    # Espaço: Melhor distribuição
```

## 🎯 Conclusão

**Tamanho atual (384x240px ≈ 48x30mm)** está perfeito para:
- ✅ QR codes legíveis
- ✅ Texto informativo
- ✅ Compatibilidade com labels 40x30mm e 50x30mm
- ✅ Custo-benefício

**Não precisa mudar nada!** Seu sistema está otimizado para o tamanho ideal.

---

**Resumo**: Sua B1 suporta 20-50mm de largura. Você está usando ~48mm (384px), que é perfeito para labels 40x30mm ou 50x30mm. Sistema atual está otimizado! 🎉