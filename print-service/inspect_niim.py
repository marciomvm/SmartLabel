import niimprint
print(dir(niimprint))
try:
    from niimprint import PrinterClient
    print("PrinterClient found")
except ImportError:
    print("PrinterClient NOT found")
